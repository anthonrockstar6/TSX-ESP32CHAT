#include <WiFi.h>
#include <ArduinoWebsockets.h>

const char* ssid = "YOUR WIFI NAME HERE";
const char* password = "YOUR PASSWORD FOR WIFI HERE";
const char* serverAddress = "ws://YOUR.IP.ADDRESS.HERE:5000";

using namespace websockets;
WebsocketsClient client;

// Pins
const int buzzerPin = 15;
const int ledPin = 33;
const int buttonPin = 4;

volatile bool notificationActive = false;
volatile bool ackPressed = false;

void IRAM_ATTR buttonISR() {
  if (notificationActive) {
    ackPressed = true;
  }
}

// Joyful rhythm (like a lil melody): short-short-long
void blipJoyfulBuzzer() {
  tone(buzzerPin, 1000, 100); // short
  delay(150);
  tone(buzzerPin, 1200, 100); // short
  delay(200);
  tone(buzzerPin, 1500, 300); // long
  delay(400);
  noTone(buzzerPin);
}

void onMessageCallback(WebsocketsMessage msg) {
  Serial.println("🔥 Msg from server: " + msg.data());
  notificationActive = true;

  digitalWrite(ledPin, HIGH);
  Serial.println("LED ON");

  blipJoyfulBuzzer();
  Serial.println("🎶 Joyful blip played");
}

void setup() {
  Serial.begin(115200);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(buttonPin), buttonISR, FALLING);

  digitalWrite(ledPin, LOW);
  noTone(buzzerPin);

  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  client.onMessage(onMessageCallback);

  Serial.println("Connecting to WebSocket server...");
  if (client.connect(serverAddress)) {
    Serial.println("✅ Connected to WebSocket server");
    client.send("{\"type\":\"msg\",\"data\":\"ESP32 has joined the chat!\"}");
  } else {
    Serial.println("❌ WebSocket connection failed.");
  }
}

void loop() {
  client.poll();

  if (ackPressed) {
    Serial.println("🔕 Acknowledged. Turning off buzzer and LED.");
    notificationActive = false;
    ackPressed = false;

    digitalWrite(ledPin, LOW);
    noTone(buzzerPin);

    client.send("{\"type\":\"ack\",\"data\":\"ESP32 acknowledged\"}");
  }

  if (Serial.available()) {
    String msg = Serial.readStringUntil('\n');
    Serial.println("Sending msg to server: " + msg);
    client.send("{\"type\":\"msg\",\"data\":\"ESP32: " + msg + "\"}");
  }
}
