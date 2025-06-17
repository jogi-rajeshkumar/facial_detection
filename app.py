from flask import Flask, render_template, request, jsonify
import os, sys
from datetime import datetime
import csv
import json
import traceback

app = Flask(__name__)

LOGS_DIR = 'logs'
CSV_FILE = os.path.join(LOGS_DIR, 'faces.csv')
FIELDNAMES = ['timestamp', 'age', 'gender', 'emotions', 'box', 'image_base64']
os.makedirs(LOGS_DIR, exist_ok=True)

# Initialize CSV file with headers if not exists
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        print("[INFO] Created new faces.csv with headers.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload')
def upload():
    return render_template('upload.html')

@app.route('/live')
def live():
    return render_template('live.html')

@app.route('/logs')
def logs():
    print("[ROUTE] GET /logs")
    csv.field_size_limit(sys.maxsize)

    records = []
    try:
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile, quoting=csv.QUOTE_ALL)
            for row in reader:
                try:
                    row['emotions'] = json.loads(row['emotions'])
                    row['box'] = json.loads(row['box'])
                    records.append(row)
                except Exception as json_err:
                    print("[ERROR] JSON parse error for row:", row)
                    traceback.print_exc()
    except Exception as file_err:
        print("[ERROR] Could not read CSV:", file_err)
        traceback.print_exc()

    print(f"[INFO] Loaded {len(records)} records from faces.csv")
    return render_template('logs.html', records=records)

@app.route('/save_image', methods=['POST'])
def save_image():
    print("[ROUTE] POST /save_image")
    try:
        data = request.get_json()
        print("[DEBUG] Data received:", json.dumps(data)[:500])

        image_data = data.get("image")
        meta = data.get("meta")

        if not image_data or not meta:
            print("[WARNING] Incomplete data")
            return jsonify({"error": "Missing image or metadata"}), 400

        record = {
            'timestamp': datetime.now().isoformat(),
            'age': round(meta.get('age', 0), 1),
            'gender': meta.get('gender', ''),
            'emotions': json.dumps(meta.get('expressions', {})),
            'box': json.dumps(meta.get('box', {})),
            'image_base64': image_data
        }

        with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES, quoting=csv.QUOTE_ALL)
            writer.writerow(record)

        print(f"[INFO] Face logged at {record['timestamp']}")
        return jsonify({"status": "success", "logged_at": record['timestamp']})

    except Exception as e:
        print("[ERROR] Exception occurred while saving face:")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
