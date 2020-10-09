import math
import numpy as np
from statistics import mean
from collections import deque
from scenarios.utils.gis import polar_to_cartesian, euclidean_distance


def get_radar_filter(config):
    pfilter_enabled = True
    qfilter_enabled = config['enable_queue_filter']
    consecutive_min = config['consecutive_detections']
    phi_sdv_max = config['phi_sdv_threshold']
    pexist_min = config['confidence_threshold']
    dbpower_min = config['d_bpower_threshold']
    step_max = config['step_max']
    queue_length = 2

    return RadarFilter(pfilter_enabled, qfilter_enabled, queue_length, consecutive_min,
                                            pexist_min, dbpower_min, phi_sdv_max, step_max)


class RadarFilter:

    def __init__(self, pfilter_enabled, qfilter_enabled, queue_length, consecutive_min,
                                        pexist_min, dbpower_min, phi_sdv_max, step_max):

        if not (pfilter_enabled or qfilter_enabled):
            print('no filter is enabled')

        self.pfilter_enabled = pfilter_enabled
        self.qfilter_enabled = qfilter_enabled
        self.queue_length = queue_length
        self.consecutive_min = consecutive_min
        self.pexist_min = pexist_min
        self.dbpower_min = dbpower_min
        self.phi_sdv_max = phi_sdv_max
        self.step_max = step_max

        self.queues = {}
        self.target_id_set = set(range(48))
    
    def update_queue(self, target_id, target):
        if target_id not in self.queues:
            self.queues[target_id] = QState(self.queue_length)
        q_state = self.queues[target_id]
        q_state.update_state(target)

    def is_valid_target(self, target):
        is_valid = True # start by assuming the target is valid

        if self.pfilter_enabled:
            is_valid = self.passive_filter(target)
        
        if self.qfilter_enabled:
            self.target_id_set.remove(target['targetId'])
            self.update_queue(target['targetId'], target)

            # only apply the queue filter if the target passed through the passive filter
            if is_valid:
                is_valid = self.queue_filter(target)

        return is_valid

    def passive_filter(self, target):
        ''' Determines if the target is valid or noise based on simple value checks.
            Returns True if the target is valid.
        '''
        if target['consecutive'] < self.consecutive_min \
            or target['pexist'] < self.pexist_min \
            or target['dBpower'] < self.dbpower_min \
            or target['phiSdv'] > self.phi_sdv_max:
            return False
        return True

    def queue_filter(self, target):
        ''' Determines if the target is valid or noise based on a given method.
            Returns True if the target is valid.
        '''
        q_state = self.queues[target['targetId']]
        queue_count = 0
        for step in q_state.steps:
            if step is None or step > self.step_max:
                return False
            queue_count += 1
        if queue_count < self.queue_length:
            return False
        return True

    def filter_targets_until_path_prediction(self, target, in_sync=True, is_combine=False, at_sync_point=False):
        if in_sync and not at_sync_point:
            if is_combine:
                dr_threshold = 8
            else:
                dr_threshold = 10
        else:
            dr_threshold = 20
        if target['dr'] > dr_threshold:
            return False
        else:
            return True


class QState:

    def __init__(self, queue_length):
        self.prev_dr = None
        self.prev_phi = None
        self.prev_consecutive = None
        self.steps = deque(maxlen=queue_length)

    def is_duplicate_target(self, target):
        if self.prev_consecutive is None \
                or target['consecutive'] != self.prev_consecutive \
                or target['dr'] != self.prev_dr \
                or target['phi'] != self.prev_phi:
            return False
        else:
            return True
    
    def update_with_default_target(self):
        self.prev_dr = None
        self.prev_phi = None
        self.prev_consecutive = None
        self.steps.append(None)
    
    def update_with_measured_target(self, target):
        if self.prev_dr is not None:
            curr_x, curr_y = polar_to_cartesian(target['phi'], target['dr'])
            prev_x, prev_y = polar_to_cartesian(self.prev_phi, self.prev_dr)
            step = euclidean_distance(prev_x, prev_y, curr_x, curr_y)
            self.steps.append(step)
        self.prev_dr = target['dr']
        self.prev_phi = target['phi']
        self.prev_consecutive = target['consecutive']
    
    def update_state(self, target):
        if self.is_duplicate_target(target):
            return
        if target['consecutive'] < 1:
            self.update_with_default_target()
        else:
            self.update_with_measured_target(target)
