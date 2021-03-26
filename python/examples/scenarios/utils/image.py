import math
import cv2
import numpy as np


def extract_image(img_bytes):
    encoded_img = np.frombuffer(img_bytes, dtype=np.uint8) # decode bytes
    decimg = cv2.imdecode(encoded_img, 1) # uncompress image
    return decimg


def show_image(image, destination_height=600):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    # image = cv2.resize(image, (0, 0), fx=.5, fy=.5)  # scale by factor
    image = resize_image(image, destination_height=destination_height)
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


def get_table_rows_cols(num_tiles):
    num_tiles_root = math.sqrt(num_tiles)
    n_rows, n_cols = int(num_tiles_root) \
        if num_tiles_root.is_integer() \
        else math.ceil(num_tiles_root) + 1, math.ceil(num_tiles_root)
    return n_rows, n_cols


def reshape_stacked_tiles_into_table(stacked_tiles, n_rows,
                                     n_cols, tile_h, tile_w, tile_d):
    # don't even know how this works
    # https://stackoverflow.com/questions/50669984/python-numpy-how-to-reshape-this-list-of-arrays-images-into-a-collage
    return stacked_tiles.reshape(
        n_rows, n_cols, tile_h, tile_w, tile_d) \
        .swapaxes(1, 2) \
        .reshape(n_rows * tile_h, tile_w * n_cols, tile_d)


def resize_image(img, destination_height=None, destination_width=None):
    if bool(destination_height) ^ bool(destination_width):
        if destination_height:
            destination_width = int(img.shape[1] / img.shape[0]
                                    * destination_height)
        else:
            destination_height = int(img.shape[0] / img.shape[1]
                                     * destination_width)
    elif destination_height and destination_width:
        print(('both destination dimensions specified, preserving aspect '
               'ratio is not guaranteed'))
    else:
        print('no destination dimensions specified, leaving original shape')
        destination_height, destination_width = img.shape[:2]
    return cv2.resize(img, (destination_width, destination_height))


def make_image_collage(primary_img, haz_imgs, all_imgs_equal_size, num_haz_cams):
    tile_h, tile_w, tile_d = primary_img.shape

    if all_imgs_equal_size:
        n_rows, n_cols = get_table_rows_cols(num_haz_cams + 1)
        img_collage = np.zeros((
            n_rows * n_cols, tile_h, tile_w, tile_d)).astype(np.uint8)
        img_collage[0, ...] = primary_img

        for cam_idx, img in haz_imgs.items():
            img_collage[cam_idx, ...] = img

        img_collage = reshape_stacked_tiles_into_table(
            img_collage, n_rows, n_cols, tile_h, tile_w, tile_d)

    else:
        n_rows, n_cols = get_table_rows_cols(num_haz_cams)
        img_collage = np.zeros((
            n_rows * n_cols, tile_h, tile_w, tile_d)).astype(np.uint8)

        for cam_idx, img in haz_imgs.items():
            img_collage[cam_idx-1, ...] = img

        img_collage = reshape_stacked_tiles_into_table(
            img_collage, n_rows, n_cols, tile_h, tile_w, tile_d)

        img_collage = resize_image(img_collage, destination_width=tile_w)

        img_collage = np.vstack((primary_img, img_collage))

    return img_collage
