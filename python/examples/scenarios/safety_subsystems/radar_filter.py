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
    queue_size = 2

    return RadarFilter(pfilter_enabled, qfilter_enabled, queue_size, consecutive_min,
                                            pexist_min, dbpower_min, phi_sdv_max, step_max)


class RadarFilter:

    def __init__(self, pfilter_enabled, qfilter_enabled, queue_size, consecutive_min,
                                        pexist_min, dbpower_min, phi_sdv_max, step_max):

        if not (pfilter_enabled or qfilter_enabled):
            print('no filter is enabled')

        self.pfilter_enabled = pfilter_enabled
        self.qfilter_enabled = qfilter_enabled
        self.queue_size = queue_size
        self.consecutive_min = consecutive_min
        self.pexist_min = pexist_min
        self.dbpower_min = dbpower_min
        self.phi_sdv_max = phi_sdv_max
        self.step_max = step_max

        self.target_queues = {}
        self.target_id_set = set(range(48))

    def is_valid_target(self, target):
        is_valid = True # start by assuming the target is valid

        if self.pfilter_enabled:
            is_valid = self.passive_filter(target)
        
        if self.qfilter_enabled:
            self.make_target_queue_if_nonexistent(target['targetId'])
            self.update_queues(target)

            if is_valid: # only apply the queue filter if the target passed through the passive filter
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
        target_id = target['targetId']
        if len(self.target_queues[target_id]['step']) < self.queue_size:
            return False

        step_arr = np.array(self.target_queues[target_id]['step']).astype(np.float64)
        is_target_steady = not (
            np.any(np.isnan(step_arr))
            or np.any(step_arr > self.step_max)
        )

        return is_target_steady

    def update_queues(self, target):
        target_id = target['targetId']
        if target['consecutive'] < 1:
            self.target_queues[target_id]['dr'].append(np.nan)
            self.target_queues[target_id]['phi'].append(np.nan)
        else:
            self.target_queues[target_id]['dr'].append(target['dr'])
            self.target_queues[target_id]['phi'].append(target['phi'])

        if len(self.target_queues[target_id]['phi']) < 2:
            return

        prev_x, prev_y = polar_to_cartesian(
            self.target_queues[target_id]['phi'][-2],
            self.target_queues[target_id]['dr'][-2]
        )
        curr_x, curr_y = polar_to_cartesian(
            self.target_queues[target_id]['phi'][-1],
            self.target_queues[target_id]['dr'][-1]
        )
        if np.isnan(prev_x) or np.isnan(curr_x):
            step = np.nan
        else:
            step = euclidean_distance(prev_x, prev_y, curr_x, curr_y)

        self.target_queues[target_id]['step'].append(step)

    def make_target_queue_if_nonexistent(self, target_id):
        if target_id not in self.target_queues:
            self.target_queues[target_id] = QState(self.queue_size)

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

    def __init__(self, queue_size):
        self.prev_dr = None
        self.prev_phi = None
        self.prev_consecutive = None
        self.steps = deque(maxlen=queue_size)

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
        curr_x, curr_y = polar_to_cartesian(target['phi'], target['dr'])
        if self.prev_dr is not None:
            prev_x, prev_y = polar_to_cartesian(self.prev_phi, self.prev_dr)
            step = euclidean_distance(prev_x, prev_y, curr_x, curr_y)
            self.steps.append(step)
        self.prev_dr = target['dr']
        self.prev_phi = target['phi']
        self.prev_consecutive = target['consecutive']
    
    def update_state(self, target):
        if self.is_duplicate_target(target):
            return
        if target['consecutive']:
            self.update_with_default_target()
        else:
            self.update_with_measured_target(target)
