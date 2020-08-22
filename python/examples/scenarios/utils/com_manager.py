import paho.mqtt.client as mqtt

class MqttConst(object):
    TRACKS_TOPIC = 'vision/tracking/targets'

class ComManager(object):

    def __init__(self, host='localhost', port=1883):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        self.client.loop_start()
        self.client.connect_async(host, port=port, keepalive=60)
        self.subscriptions = {}
    

    def subscribe(self, topic, callbackFn):
        if isinstance(topic, list): # subscribing to multiple topics in one subscription
            qos_lst = [] # must pass quality of service in as an argument when subscribing to multiple topics
            for tpc in topic:
                qos_lst.append(0) # default quality of service is 0
                if self.subscriptions.get(tpc) is None:
                    self.subscriptions[tpc] = [callbackFn]
                elif callbackFn not in self.subscriptions.get(tpc):
                    self.subscriptions[tpc].append(callbackFn)
            self.client.subscribe(list(zip(topic,qos_lst))) # the client.subscribe argument for multiple topics is a list of tuples e.g. [('topic1',qos),('topic2',qos)]

        else: # only subscribing to one topic
            self.client.subscribe(topic)
            if self.subscriptions.get(topic) is None:
                self.subscriptions[topic] = [callbackFn]
            elif callbackFn not in self.subscriptions.get(topic):
                self.subscriptions[topic].append(callbackFn)
        
        return lambda: self.unsubscribe(topic, callbackFn)


    def remove_topic_if_subs_empty(self, topic):
        subs = self.subscriptions.get(topic)  
        if subs is not None and len(subs) == 0:
            del self.subscriptions[topic]


    def unsubscribe(self, topic, callbackFn):
        self.client.unsubscribe(topic)
        if isinstance(topic, list):
            cllbck_deleted = False
            for tpc in topic:
                subs = self.subscriptions.get(tpc)
                if subs is None:
                    return 0
                for i in range(len(subs)):
                    if subs[i] == callbackFn:
                        del subs[i]
                        self.remove_topic_if_subs_empty(tpc)
                        cllbck_deleted = True
                        break
            if cllbck_deleted:
                return 1
                        
        else: # only one topic string
            subs = self.subscriptions.get(topic)
            if subs is None:
                return 0
            for i in range(len(subs)):
                if subs[i] == callbackFn:
                    del subs[i]
                    self.remove_topic_if_subs_empty(topic)
                    return 1

        return 0


    def on_connect(self, client, userdata, flags, rc):
        print("Connected with result code " + str(rc))
        for key in self.subscriptions:
            self.client.subscribe(key)


    def on_message(self, client, userdata, msg):
        simplified_topic = simplify_topic(msg.topic)
        topic_cbs = self.subscriptions.get(simplified_topic)
        if topic_cbs is not None:
            for cb in topic_cbs:
                cb(msg)


    def on_disconnect(self, client, userdata, rc):
        print("Client  disconnected")


def simplify_topic(topic):
    topic_components = topic.split('/')
    if len(topic_components[0]) > 25: # first element in topic is a long machine ID
        simplified_topic = '+/'+'/'.join(topic_components[1:])
    else:
        simplified_topic = topic
    # if len(topic_components) >= 4: # the recieved topic is more specific than what we subscribe to
    #     simplified_topic = '+/'+'/'.join(topic_components[1:3])+'/#'

    return simplified_topic