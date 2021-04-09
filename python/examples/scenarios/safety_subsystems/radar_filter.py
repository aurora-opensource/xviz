import math
from collections import deque
from scenarios.utils.gis import polar_to_cartesian, euclidean_distance


QUEUE_LENGTH = 6


class RadarFilter:

    def __init__(self, config):
        self.config = config
        self.queues = {}
        self.prev_target_set = None
        self.target_id_set = set(range(48))

    def update_queue(self, target_id, target, sync_status):
        if target_id not in self.queues:
            self.queues[target_id] = QState(self.config)
        q_state = self.queues[target_id]
        q_state.update_state(target, sync_status)

    def is_valid_target(self, target, sync_status):
        self.update_queue(target['targetId'], target, sync_status)
        self.target_id_set.remove(target['targetId'])

        _, target_y = polar_to_cartesian(target['phi'], target['dr'])
        if sync_status['inSync'] \
                and target_y > self.config['sync_y_cutoff']:
            return False

        return self.queue_filter(target, sync_status)

    def queue_filter(self, target, sync_status):
        ''' Determines if the target is valid or noise based on a given method.
            Returns True if the target is valid.
        '''
        q_state = self.queues[target['targetId']]
        for i, step in enumerate(list(q_state.steps)[::-1]):
            if not sync_status['inSync'] \
                    and i + 1 > self.config['not_sync_queue_length']:
                break
            if step is None or step > self.config['step_max']:
                return False
        return True


class QState:

    def __init__(self, config):
        self.config = config
        self.prev_target = None
        self.steps = deque(maxlen=QUEUE_LENGTH)

    def is_duplicate_target(self, target):
        if self.prev_target is not None \
                and self.prev_target == target:
            return True
        return False

    def target_meets_thresholds(self, target, sync_status):
        ''' Determines if the target is valid or noise based on simple value checks.
            Returns True if the target is valid.
        '''
        if sync_status['inSync']:
            confidence_threshold = self.config['sync_confidence_threshold']
            d_bpower_threshold = self.config['sync_d_bpower_threshold']
            phi_sdv_threshold = self.config['sync_phi_sdv_threshold']
        else:
            confidence_threshold = self.config['confidence_threshold']
            d_bpower_threshold = self.config['d_bpower_threshold']
            phi_sdv_threshold = self.config['phi_sdv_threshold']
        if target['pexist'] < confidence_threshold \
            or target['dBpower'] < d_bpower_threshold \
            or target['phiSdv'] > phi_sdv_threshold:
            return False
        return True

    def update_with_default_target(self):
        self.prev_target = None
        self.steps.append(None)

    def update_with_measured_target(self, target):
        if self.prev_target is not None:
            curr_x, curr_y = polar_to_cartesian(target['phi'], target['dr'])
            prev_x, prev_y = polar_to_cartesian(self.prev_target['phi'], self.prev_target['dr'])
            step = euclidean_distance(prev_x, prev_y, curr_x, curr_y)
            self.steps.append(step)
        self.prev_target = target

    def update_state(self, target, sync_status):
        if self.is_duplicate_target(target):
            return
        if self.target_meets_thresholds(target, sync_status):
            self.update_with_measured_target(target)
        else:
            if target['consecutive'] < 1:
                self.update_with_default_target()
            else:
                self.prev_target = target
                self.steps.append(None)


class SmartMicroRadarFilter:

    def __init__(self, dBpower_threshold=0.):
        self.dBpower_threshold = dBpower_threshold

    def is_valid_target(self, target):
        return target['dBpower'] > self.dBpower_threshold \
            # and target['vr'] != 0.0
