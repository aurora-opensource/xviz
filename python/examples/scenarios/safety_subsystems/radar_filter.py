import numpy as np
from collections import deque

class RadarFilter:

    def __init__(self, pfilter_enabled, qfilter_enabled, queue_size, consecutive_min, pf_pexist_min,
                    qf_pexist_min, pf_dbpower_min, qf_dbpower_min, phi_sdv_max, nan_threshold):

        if not (pfilter_enabled or qfilter_enabled):
            print('no filter is enabled')

        self.pfilter_enabled = pfilter_enabled
        self.qfilter_enabled = qfilter_enabled
        self.queue_size = queue_size
        self.consecutive_min = consecutive_min
        self.pf_pexist_min = pf_pexist_min
        self.qf_pexist_min = qf_pexist_min
        self.pf_dbpower_min = pf_dbpower_min
        self.qf_dbpower_min = qf_dbpower_min
        self.phi_sdv_max = phi_sdv_max
        self.nan_threshold = nan_threshold # maximum percent of queue that can be nan before it is automatically evaluated as an invalid target

        self.target_queues = {}


    def is_valid_target(self, target_id, target):
        is_valid = True # start by assuming the target is valid

        if self.pfilter_enabled:
            is_valid = self.passive_filter(target)
        
        if self.qfilter_enabled:
            self.make_target_queue_if_nonexistent(target_id)
            self.update_queues(target_id, target)

            if is_valid: # only apply the queue filter if the target passed through the passive filter
                if self.is_default_target(target):
                    return False

                is_valid = self.queue_filter(target_id)

        return is_valid


    def passive_filter(self, target):
        ''' Determines if the target is valid or noise based on simple value checks.
            Returns True if the target is valid.
        '''
        if target['consecutive'] < self.consecutive_min \
            or target['pexist'] < self.pf_pexist_min \
            or target['dBpower'] <= self.pf_dbpower_min \
            or target['phiSdv'] >= self.phi_sdv_max:
            return False
        return True


    def queue_filter(self, target_id):
        ''' Determines if the target is valid or noise based on a given method.
            Returns True if the target is valid.
        '''
        if np.isnan(self.target_queues[target_id]['consecutive_queue']).sum() / self.queue_size > self.nan_threshold \
            or np.nanmean(self.target_queues[target_id]['consecutive_queue']) < self.consecutive_min \
            or np.nanmean(self.target_queues[target_id]['pexist_queue']) < self.qf_pexist_min \
            or np.nanmean(self.target_queues[target_id]['d_bpower_queue']) <= self.qf_dbpower_min \
            or np.nanmean(self.target_queues[target_id]['phi_sdv_queue']) >= self.phi_sdv_max:
            return False
        return True


    def is_default_target(self, target):
        ''' Determines if there are measurments corresponding to the given target
            or if it is just a default message.
            Returns True if the target is a default message.
        '''
        if target['consecutive'] < 1:
            return True
        return False


    def update_queues(self, target_id, target):
        if self.is_default_target(target):
            self.target_queues[target_id]['consecutive_queue'].append(np.nan)
            self.target_queues[target_id]['pexist_queue'].append(np.nan)
            self.target_queues[target_id]['d_bpower_queue'].append(np.nan)
            self.target_queues[target_id]['phi_sdv_queue'].append(np.nan)
        else:
            self.target_queues[target_id]['consecutive_queue'].append(target['consecutive'])
            self.target_queues[target_id]['pexist_queue'].append(target['pexist'])
            self.target_queues[target_id]['d_bpower_queue'].append(target['dBpower'])
            self.target_queues[target_id]['phi_sdv_queue'].append(target['phiSdv'])


    def make_target_queue_if_nonexistent(self, target_id):
        if target_id not in self.target_queues:
            self.target_queues[target_id] = {}
            self.target_queues[target_id]['consecutive_queue'] = deque(maxlen=self.queue_size)
            self.target_queues[target_id]['pexist_queue'] = deque(maxlen=self.queue_size)
            self.target_queues[target_id]['d_bpower_queue'] = deque(maxlen=self.queue_size)
            self.target_queues[target_id]['phi_sdv_queue'] = deque(maxlen=self.queue_size)

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
