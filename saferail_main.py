import os
os.environ["GPIOZERO_PIN_FACTORY"] = "lgpio"

import cv2
import time
import threading
import json
import paho.mqtt.client as mqtt
import firebase_admin
from firebase_admin import credentials, db
from gpiozero import LED, Buzzer
from ultralytics import YOLO

# ================= FIREBASE =================
cred = credentials.Certificate("firebase_key.json")

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://saferail-vision-default-rtdb.firebaseio.com/'
})

# ================= MQTT =================
MQTT_BROKER = "10.51.124.226"
MQTT_PORT = 1883
MQTT_TOPIC = "saferail/data"

esp_data = {}

def on_connect(client, userdata, flags, rc):
    print("MQTT Connected")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    global esp_data
    try:
        esp_data = json.loads(msg.payload.decode())
        print("ESP Data Received:", esp_data)
    except:
        print("MQTT Error")

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)

threading.Thread(target=mqtt_client.loop_forever, daemon=True).start()

# ================= GPIO =================
led_green = LED(5)
led_yellow = LED(6)
led_red = LED(13)
buzzer = Buzzer(18)

led_green.on()
led_yellow.off()
led_red.off()
buzzer.off()

# ================= YOLO =================
model = YOLO("yolov8n.pt")

PRIORITY_CLASSES = ["person","dog","cow","horse","sheep","bear","elephant","cat","zebra","giraffe"]
NORMAL_CLASSES = ["car","truck","motorcycle","bench","backpack","suitcase","handbag"]

blink_red = False

def red_blinker():
    global blink_red
    while True:
        if blink_red:
            led_red.toggle()
            time.sleep(0.25)
        else:
            led_red.off()
            time.sleep(0.1)

threading.Thread(target=red_blinker, daemon=True).start()

FOCAL_LENGTH = 650
KNOWN_WIDTH = 0.5

def estimate_distance(width):
    if width <= 0:
        return None
    return round((KNOWN_WIDTH * FOCAL_LENGTH) / width, 2)

def upload_to_firebase(status, risk, distance):
    ref = db.reference("live")

    data = {
        "timestamp": int(time.time()),
        "intrusion_status": status,
        "risk_level": risk,
        "intrusion_distance": distance,
        "temperature": esp_data.get("temperature"),
        "humidity": esp_data.get("humidity"),
        "weight": esp_data.get("weight"),
        "vibration": esp_data.get("vibration"),
        "ir": esp_data.get("ir"),
        "ldr": esp_data.get("ldr"),
        "accX": esp_data.get("accX"),
        "accY": esp_data.get("accY"),
        "accZ": esp_data.get("accZ"),
    }

    ref.set(data)
    print("Firebase Updated")

def start_camera():
    global blink_red

    cap = cv2.VideoCapture(0)
    cap.set(3,640)
    cap.set(4,480)

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        results = model(frame, stream=True)

        high = False
        medium = False
        min_distance = None

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                name = model.names[cls]
                x1,y1,x2,y2 = box.xyxy[0]
                width = float(x2-x1)

                distance = estimate_distance(width)

                if distance:
                    if min_distance is None or distance < min_distance:
                        min_distance = distance

                if name in PRIORITY_CLASSES:
                    high = True
                elif name in NORMAL_CLASSES:
                    medium = True

        status = "No Intrusion"
        risk = "LOW"

        if high:
            status = "Intrusion Detected"
            risk = "HIGH"
            blink_red = True
            buzzer.on()
            led_green.off()

        elif medium:
            status = "Obstruction Detected"
            risk = "MEDIUM"
            blink_red = False
            led_red.on()
            buzzer.on()
            led_green.off()

        else:
            blink_red = False
            buzzer.off()
            led_red.off()
            led_green.on()

        upload_to_firebase(status, risk, min_distance)

        cv2.imshow("SafeRail Vision", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

        time.sleep(1)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    start_camera()
