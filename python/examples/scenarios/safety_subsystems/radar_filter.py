import math
from collections import deque

class RadarFilter:

    def __init__(self, pfilter_enabled, qfilter_enabled, queue_size, consecutive_min,
                                pexist_min, dbpower_min, phi_sdv_max, max_distance_step):

        if not (pfilter_enabled or qfilter_enabled):
            print('no filter is enabled')

        self.pfilter_enabled = pfilter_enabled
        self.qfilter_enabled = qfilter_enabled
        self.queue_size = queue_size
        self.consecutive_min = consecutive_min
        self.pexist_min = pexist_min
        self.dbpower_min = dbpower_min
        self.phi_sdv_max = phi_sdv_max
        self.max_distance_step = max_distance_step

        self.target_queues = {}

    def is_valid_target(self, target):
        is_valid = True # start by assuming the target is valid

        if self.pfilter_enabled:
            is_valid = self.passive_filter(target)
        
        if self.qfilter_enabled:
            self.make_target_queue_if_nonexistent(target['targetId'])

            if is_valid: # only apply the queue filter if the target passed through the passive filter
                is_valid = self.queue_filter(target)

            self.update_queues(target)

        return is_valid

    def passive_filter(self, target):
        ''' Determines if the target is valid or noise based on simple value checks.
            Returns True if the target is valid.
        '''
        if target['consecutive'] < self.consecutive_min \
            or target['pexist'] < self.pexist_min \
            or target['dBpower'] <= self.dbpower_min \
            or target['phiSdv'] >= self.phi_sdv_max:
            return False
        return True

    def queue_filter(self, target):
        ''' Determines if the target is valid or noise based on a given method.
            Returns True if the target is valid.
        '''
        target_id = target['targetId']
        if not self.target_queues[target_id]['dr']:
            return False

        prev_x, prev_y = polar_to_cartesian(
            self.target_queues[target_id]['phi'][-1],
            self.target_queues[target_id]['dr'][-1]
        )
        curr_x, curr_y = polar_to_cartesian(
            target['phi'],
            target['dr']
        )
        if target_id == 0:
            print(euclidean_distance(prev_x, prev_y, curr_x, curr_y))
        return euclidean_distance(prev_x, prev_y, curr_x, curr_y) < self.max_distance_step

    def update_queues(self, target):
        target_id = target['targetId']
        self.target_queues[target_id]['dr'].append(target['dr'])
        self.target_queues[target_id]['phi'].append(target['phi'])

    def make_target_queue_if_nonexistent(self, target_id):
        if target_id not in self.target_queues:
            self.target_queues[target_id] = {}
            self.target_queues[target_id]['dr'] = deque(maxlen=self.queue_size)
            self.target_queues[target_id]['phi'] = deque(maxlen=self.queue_size)

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


def polar_to_cartesian(theta, r):
    return (r * math.cos(theta), r * math.sin(theta))


def euclidean_distance(x0, y0, x1, y1):
    return math.sqrt((x1-x0)**2 + (y1-y0)**2)
