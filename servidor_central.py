import socket
import threading
import time
from supabase import create_client, Client

# --- CONFIGURACION DE SUPABASE ---
SUPABASE_URL = "https://fodbwpaeodiweaatzmxw.supabase.co" 
SUPABASE_KEY = "sb_publishable_JK0VaywyUg5Q89xQRZQ6qQ_KD_UxdsH"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def guardar_en_supabase(origen, contenido):
    """Inserta datos en la tabla central de Supabase"""
    try:
        data = {
            "origen": origen,
            "contenido": contenido
            # La fecha se genera sola en Supabase 
        }
        supabase.table("datos_central").insert(data).execute()
        print(f"[DB] {origen} guardado.")
    except Exception as e:
        print(f"[DB ERROR]: {e}")

def manejar_cliente_tcp():
    """Servidor Concurrente para Agente Transaccional (TCP)"""
    server_tcp = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    # El socket.SOL_SOCKET permite reutilizar el puerto inmediatamente si reinicias el server
    server_tcp.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_tcp.bind(('127.0.0.1', 12000))
    server_tcp.listen(5)
    print(f"[*] Servidor TCP activo en puerto 12000")

    while True:
        conexion, direccion = server_tcp.accept()
        # Se crea un hilo por cada conexion TCP para que sea realmente concurrente
        hilo_cli = threading.Thread(target=atender_conexion_tcp, args=(conexion, direccion))
        hilo_cli.start()

def atender_conexion_tcp(conexion, direccion):
    print(f"[TCP] Nueva conexión: {direccion}")
    buffer = ""
    try:
        while True:
            datos = conexion.recv(4096) # Se aumenta  el buffer a 4096
            if not datos: break
            
            buffer += datos.decode('utf-8')
            
            # Se separa por saltos de linea por si llegan varios registros juntos
            while "\n" in buffer:
                linea, buffer = buffer.split("\n", 1)
                linea = linea.strip()
                if linea:
                    print(f"[Recibido TCP]: {linea}")
                    guardar_en_supabase("TCP", linea)
    except Exception as e:
        print(f"[Error TCP con {direccion}]: {e}")
    finally:
        conexion.close()

def manejar_cliente_udp():
    """Servidor para Agente de Telemetria (UDP)"""
    server_udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server_udp.bind(('127.0.0.1', 12001))
    print(f"[*] Servidor UDP activo en puerto 12001")

    while True:
        datos, direccion = server_udp.recvfrom(1024)
        mensaje = datos.decode('utf-8').strip()
        print(f"[Recibido UDP]: {mensaje}")
        
        # En UDP no hay hilos por cliente porque no hay conexión, 
        # se procesa directo o se manda a un hilo de guardado.
        guardar_en_supabase("UDP", mensaje)

if __name__ == "__main__":
    # La concurrencia principal: Un hilo para TCP y otro para UDP
    hilo_principal_tcp = threading.Thread(target=manejar_cliente_tcp, daemon=True)
    hilo_principal_udp = threading.Thread(target=manejar_cliente_udp, daemon=True)

    print("--- INICIANDO SISTEMA DE INGESTA (FASE 2) ---")
    hilo_principal_tcp.start()
    hilo_principal_udp.start()

    try:
        while True:
            time_sleep = 1 
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServidor apagado.")