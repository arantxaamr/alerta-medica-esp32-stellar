/*
 * Pulso — prototipo local ESP32 WROOM-32 / DevKit.
 * Dos pulsaciones físicas separadas, con liberación entre ellas, activan el evento.
 * Una sola pulsación o mantener el botón presionado NO activa la alerta.
 * Este firmware todavía NO envía HTTPS, correo ni confirma recepción por servidor.
 * TODO T07: Wi-Fi, HTTPS POST /api/device-events, firma, reintentos y deduplicación.
 */

const int BUTTON_PIN = 27;
const int LED_PIN = 2;
const unsigned long DEBOUNCE_MS = 40;
const unsigned long DOUBLE_PRESS_WINDOW_MS = 3000;
const unsigned long COOLDOWN_MS = 5000;

bool lastRaw = HIGH;
bool lastStable = HIGH;
bool waitingForSecondPress = false;
bool hasTriggered = false;
unsigned long lastRawChangeMs = 0;
unsigned long firstPressMs = 0;
unsigned long lastTriggerMs = 0;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.begin(115200);
  Serial.println("Pulso listo — presiona dos veces el boton GPIO27");
}

void loop() {
  const unsigned long now = millis();
  const bool raw = digitalRead(BUTTON_PIN);

  if (waitingForSecondPress && (now - firstPressMs) > DOUBLE_PRESS_WINDOW_MS) {
    waitingForSecondPress = false;
    Serial.println("Primer toque expirado — ninguna alerta");
  }

  if (raw != lastRaw) {
    lastRaw = raw;
    lastRawChangeMs = now;
  }

  if ((now - lastRawChangeMs) < DEBOUNCE_MS || raw == lastStable) {
    return;
  }

  lastStable = raw;
  if (lastStable != LOW) {
    return;  // La liberacion separa las dos pulsaciones.
  }

  if (hasTriggered && (now - lastTriggerMs) < COOLDOWN_MS) {
    return;  // Evita eventos locales repetidos por pulsaciones posteriores.
  }

  if (!waitingForSecondPress) {
    waitingForSecondPress = true;
    firstPressMs = now;
    Serial.println("Primer toque detectado — esperando segundo toque; ninguna alerta");
    return;
  }

  waitingForSecondPress = false;
  hasTriggered = true;
  lastTriggerMs = now;
  Serial.println("ALERT_TRIGGER — doble pulsacion detectada (solo evento local)");

  // El LED confirma el gesto local, NO la entrega de una alerta por internet.
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(80);
    digitalWrite(LED_PIN, LOW);
    delay(80);
  }
}
