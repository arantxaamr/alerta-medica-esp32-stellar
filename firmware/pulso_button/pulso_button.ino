/*
 * Pulso — firmware ESP32 DevKit V1
 * Pulsador en GPIO27 (INPUT_PULLUP), LED en GPIO2 (LED integrado típico).
 * TODO T07: Wi-Fi, HTTPS POST /api/device-events, firma, reintentos, dedupe.
 */

const int BUTTON_PIN = 27;
const int LED_PIN = 2;
const unsigned long DEBOUNCE_MS = 40;
const unsigned long HOLD_MS = 1200;

bool lastStable = HIGH;
bool lastRaw = HIGH;
unsigned long lastChangeMs = 0;
unsigned long pressStartMs = 0;
bool holdSent = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.begin(115200);
  Serial.println("Pulso firmware boot — botón GPIO27, LED GPIO2");
}

void loop() {
  const bool raw = digitalRead(BUTTON_PIN);
  const unsigned long now = millis();

  if (raw != lastRaw) {
    lastChangeMs = now;
    lastRaw = raw;
  }

  if ((now - lastChangeMs) < DEBOUNCE_MS) {
    return;
  }

  if (raw != lastStable) {
    lastStable = raw;
    if (raw == LOW) {
      pressStartMs = now;
      holdSent = false;
      digitalWrite(LED_PIN, HIGH);
    } else {
      digitalWrite(LED_PIN, LOW);
    }
  }

  if (lastStable == LOW && !holdSent && (now - pressStartMs) >= HOLD_MS) {
    holdSent = true;
    Serial.println("ALERT_TRIGGER — sustained press detected (stub; wire HTTPS next)");
    // Blink ack placeholder
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, LOW);
      delay(80);
      digitalWrite(LED_PIN, HIGH);
      delay(80);
    }
  }
}
