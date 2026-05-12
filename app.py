from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client

app = Flask(__name__)
CORS(app) # Esto permite que React se conecte sin errores

# Usa tus credenciales de la Fase 2
SUPABASE_URL = "https://fodbwpaeodiweaatzmxw.supabase.co" 
SUPABASE_KEY = "sb_publishable_JK0VaywyUg5Q89xQRZQ6qQ_KD_UxdsH"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/api/datos', methods=['GET'])
def obtener_datos():
    # Consulta SQL a la tabla donde los agentes guardaron todo
    try:
        res = supabase.table("datos_central").select("*").execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)