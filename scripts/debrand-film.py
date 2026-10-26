"""Remove synthetic jersey markings from the fictional companion film.

The source is generated footage, not measurement evidence. We use jersey-color
regions to find dark printed marks, then inpaint only inside the shirt surface.
This intentionally leaves player numbers on the back intact.
"""
import argparse
import os
import subprocess
import sys

import cv2
import numpy as np

TRACKS = [
    {'start': .5, 'end': 6.85, 'box': (525, 185, 105, 105), 'team': 'green'},
    {'start': 53.0, 'end': 54.9, 'box': (405, 167, 150, 190), 'team': 'blue-side'},
    {'start': 56.0, 'end': 60.0, 'box': (813, 170, 220, 210), 'team': 'blue'},
]


def clean_frame(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    height, width = frame.shape[:2]
    full_mask = np.zeros((height, width), dtype=np.uint8)
    for low, high in [((26, 35, 58), (82, 255, 255)), ((86, 35, 65), (119, 255, 255))]:
        color = cv2.inRange(hsv, np.array(low), np.array(high))
        count, labels, stats, _ = cv2.connectedComponentsWithStats(color, 8)
        for index in range(1, count):
            x, y, w, h, area = stats[index]
            if area < 450 or area > 48000 or w < 28 or h < 28 or w > 380 or h > 360 or y > height * .73:
                continue
            crop = (labels[y:y+h, x:x+w] == index).astype(np.uint8) * 255
            hull = cv2.convexHull(cv2.findNonZero(crop))
            region = np.zeros_like(crop)
            cv2.fillConvexPoly(region, hull, 255)
            # A print sits centrally on the front; trim the hull so shadows,
            # collar and sleeve edges remain natural.
            allowed = np.zeros_like(region)
            allowed[int(h*.21):int(h*.78), int(w*.14):int(w*.88)] = 255
            jersey_values = hsv[y:y+h, x:x+w, 2][crop > 0]
            if not len(jersey_values):
                continue
            darkness = int(np.median(jersey_values) * .63)
            dark = cv2.inRange(hsv[y:y+h, x:x+w, 2], 0, darkness)
            holes = cv2.bitwise_and(region, cv2.bitwise_not(crop))
            marks = cv2.bitwise_and(cv2.bitwise_and(holes, dark), allowed)
            marks = cv2.dilate(marks, np.ones((5, 5), np.uint8))
            full_mask[y:y+h, x:x+w] = cv2.bitwise_or(full_mask[y:y+h, x:x+w], marks)
    if cv2.countNonZero(full_mask) == 0:
        return frame, full_mask
    return cv2.inpaint(frame, full_mask, 8, cv2.INPAINT_TELEA), full_mask


def clean_tracked_shirt(frame, box, team):
    x, y, w, h = [int(value) for value in box]
    mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    if team == 'blue':
        # Remove the dark sponsor glyphs, rather than inpainting a whole chest
        # rectangle. Broad inpainting erased fabric folds and looked artificial.
        sponsor = np.zeros_like(mask)
        cv2.rectangle(sponsor, (x+int(.23*w), y+int(.37*h)),
                      (x+int(.82*w), y+int(.60*h)), 255, -1)
        value = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)[:, :, 2]
        dark = cv2.inRange(value, 0, 144)
        mask = cv2.bitwise_and(sponsor, dark)
        mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
        # The small chest marks are bounded separately, and the camera sees
        # enough surrounding shirt to restore their color and texture.
        cv2.ellipse(mask, (x+int(.635*w), y+int(.27*h)),
                    (max(5,int(.09*w)), max(5,int(.085*h))), 0, 0, 360, 255, -1)
        cv2.ellipse(mask, (x+int(.32*w), y+int(.30*h)),
                    (max(5,int(.08*w)), max(5,int(.06*h))), 0, 0, 360, 255, -1)
        return cv2.inpaint(frame, mask, 5, cv2.INPAINT_TELEA), mask
    if team == 'blue-side':
        sponsor = np.zeros_like(mask)
        cv2.rectangle(sponsor, (x+int(.53*w), y+int(.33*h)),
                      (x+int(.94*w), y+int(.60*h)), 255, -1)
        value = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)[:, :, 2]
        dark = cv2.inRange(value, 0, 126)
        mask = cv2.dilate(cv2.bitwise_and(sponsor, dark), np.ones((3,3),np.uint8))
        cv2.ellipse(mask, (x+int(.30*w), y+int(.12*h)),
                    (max(5,int(.11*w)), max(5,int(.08*h))), 0, 0, 360, 255, -1)
        cv2.ellipse(mask, (x+int(.74*w), y+int(.21*h)),
                    (max(5,int(.06*w)), max(5,int(.05*h))), 0, 0, 360, 255, -1)
        return cv2.inpaint(frame, mask, 5, cv2.INPAINT_TELEA), mask
    else:
        zones = [(.20, .47, 1.0, .86), (.18, .23, .47, .47), (.59, .20, .96, .48)]
    for left, top, right, bottom in zones:
        pt1 = (max(0, x+int(left*w)), max(0, y+int(top*h)))
        pt2 = (min(frame.shape[1]-1, x+int(right*w)), min(frame.shape[0]-1, y+int(bottom*h)))
        cv2.rectangle(mask, pt1, pt2, 255, -1)
    return cv2.inpaint(frame, mask, 18, cv2.INPAINT_TELEA), mask


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='dist/assets/pitchside-minute.mp4')
    parser.add_argument('--output', default='dist/assets/pitchside-minute-clean.mp4')
    parser.add_argument('--preview-at', type=float)
    parser.add_argument('--preview-prefix', default='tmp/debrand-preview')
    parser.add_argument('--preview-box', type=int, nargs=4)
    parser.add_argument('--team', choices=['green', 'blue', 'blue-side'], default='green')
    args = parser.parse_args()
    capture = cv2.VideoCapture(args.input)
    if not capture.isOpened():
        raise RuntimeError(f'Could not open {args.input}')
    fps = capture.get(cv2.CAP_PROP_FPS)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if args.preview_at is not None:
        capture.set(cv2.CAP_PROP_POS_MSEC, args.preview_at * 1000)
        okay, frame = capture.read()
        if not okay:
            raise RuntimeError('Preview time outside film')
        clean, mask = clean_tracked_shirt(frame, args.preview_box, args.team) if args.preview_box else clean_frame(frame)
        cv2.imwrite(args.preview_prefix + '-before.jpg', frame)
        cv2.imwrite(args.preview_prefix + '-after.jpg', clean)
        cv2.imwrite(args.preview_prefix + '-mask.png', mask)
        print(f'{args.preview_at:.2f}s: {cv2.countNonZero(mask)} pixels cleaned')
        return
    command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
               '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{width}x{height}',
               '-r', str(fps), '-i', 'pipe:0', '-i', args.input,
               '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-preset', 'fast',
               '-crf', '19', '-pix_fmt', 'yuv420p', '-r', str(fps),
               '-c:a', 'copy', '-movflags', '+faststart', args.output]
    child = subprocess.Popen(command, stdin=subprocess.PIPE)
    frames = 0
    active = {}
    try:
        while True:
            okay, frame = capture.read()
            if not okay:
                break
            clean = frame.copy()
            for index, track in enumerate(TRACKS):
                first = round(track['start'] * fps)
                last = round(track['end'] * fps)
                if frames < first or frames >= last:
                    continue
                if frames == first:
                    tracker = cv2.TrackerCSRT_create()
                    tracker.init(frame, track['box'])
                    active[index] = tracker
                    box = track['box']
                elif index in active:
                    found, box = active[index].update(frame)
                    if not found:
                        del active[index]
                        continue
                else:
                    continue
                clean, _ = clean_tracked_shirt(clean, box, track['team'])
            child.stdin.write(clean.tobytes())
            frames += 1
            if frames % 240 == 0:
                print(f'Cleaned {frames} frames', flush=True)
    finally:
        capture.release()
        child.stdin.close()
    if child.wait() != 0:
        raise RuntimeError('Film encoder failed')
    print(f'{args.output}: {frames} frames at {fps:.2f} fps')


if __name__ == '__main__':
    main()
