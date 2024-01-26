from flask import Flask, render_template, send_from_directory, jsonify
import os

app = Flask(__name__)

# Define the directory where static files are located
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# Define the FHIR data
fhir_data = {
    "resourceType": "Bundle",
    "id": "bundle-transaction",
    "type": "transaction",
    "entry": [
        # ... (your FHIR data)
    ]
}

# Endpoint to serve index.html
@app.route('/')
def index():
    return render_template('index.html')

# Endpoint to serve FHIR data
@app.route('/fhir_data.json')
def get_fhir_data():
    return jsonify(fhir_data)

# Endpoint to serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True)
