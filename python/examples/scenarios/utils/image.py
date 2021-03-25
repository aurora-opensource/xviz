import cv2
import numpy as np


def extract_image(img_bytes):
    encoded_img = np.frombuffer(img_bytes, dtype=np.uint8) # decode bytes
    decimg = cv2.imdecode(encoded_img, 1) # uncompress image
    return decimg


def show_image(image):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, (0, 0), fx=.5, fy=.5)
    cv2.imshow('collector-scenario', image)
    cv2.moveWindow('collector-scenario', 0, 0)
    cv2.waitKey(1)


def draw_cam_targets_on_image(image, camera_output):
    for target in camera_output['targets']:
        tl, br = target['topleft'], target['bottomright']
        tl['x'], tl['y'] = int(tl['x']), int(tl['y'])
        br['x'], br['y'] = int(br['x']), int(br['y'])

        label = target['label']
        conf = str("%.1f" % (target['confidence'] * 100)) + '%'

        thickness = (image.shape[0] + image.shape[1]) // 1000
        fontFace = cv2.FONT_HERSHEY_SIMPLEX  # 'font/FiraMono-Medium.otf',
        fontScale = 1
        label_size = cv2.getTextSize(label, fontFace, fontScale, thickness)
        if tl['y'] - label_size[1] >= 0:
            text_origin = (tl['x'], tl['y'] - label_size[1])
        else:
            text_origin = (tl['x'], tl['y'] + 1)

        box_color = (241, 240, 236)
        cv2.rectangle(image, (tl['x'], tl['y']), (br['x'], br['y']),
                    box_color, thickness)
        cv2.putText(image, conf, text_origin, fontFace,
                    fontScale, box_color, 2)

    return image
