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
    
    def update_queue(self, target_id, target):
        if target_id not in self.queues:
            self.queues[target_id] = QState(self.config)
        q_state = self.queues[target_id]
        q_state.update_state(target)

    def is_valid_target(self, target, sync_status=None):        
        self.update_queue(target['targetId'], target)
        self.target_id_set.remove(target['targetId'])

        if sync_status is not None \
                and sync_status['inSync'] \
                and target['phi'] * 180 / math.pi > self.config['left_fov_cutoff']:
            return False
        
        return self.queue_filter(target)

    def queue_filter(self, target):
        ''' Determines if the target is valid or noise based on a given method.
            Returns True if the target is valid.
        '''
        q_state = self.queues[target['targetId']]
        for step in q_state.steps:
            if step is None or step > self.config['step_max']:
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

    def __init__(self, config):
        self.phi_sdv_max = config['phi_sdv_threshold']
        self.pexist_min = config['confidence_threshold']
        self.dbpower_min = config['d_bpower_threshold']
        self.prev_target = None
        self.steps = deque(maxlen=QUEUE_LENGTH)

    def is_duplicate_target(self, target):
        if self.prev_target is not None \
                and self.prev_target == target:
            return True
        return False
    
    def target_meets_thresholds(self, target):
        ''' Determines if the target is valid or noise based on simple value checks.
            Returns True if the target is valid.
        '''
        if target['pexist'] < self.pexist_min \
            or target['dBpower'] < self.dbpower_min \
            or target['phiSdv'] > self.phi_sdv_max:
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
    
    def update_state(self, target):
        if self.is_duplicate_target(target):
            return
        if self.target_meets_thresholds(target):
            self.update_with_measured_target(target)
        else:
            if target['consecutive'] < 1:
                self.update_with_default_target()
            else:
                self.prev_target = target
                self.steps.append(None)
