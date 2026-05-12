import socket
import random
import time

def ejecutar_agente_udp():

    HOST = '127.0.0.1'
    PORT = 12001

    # Socket UDP
    cliente_udp = socket.socket(
        socket.AF_INET,
        socket.SOCK_DGRAM
    )

    print(f"Agente UDP enviando a {HOST}:{PORT}")

    try:

        while True:

            # Datos simulados
            temperatura = round(
                random.uniform(18.0, 42.0), 2
            )

            uso_cpu = random.randint(10, 90)

            uso_ram = random.randint(20, 95)

            latencia = random.randint(1, 200)

            ordenes = random.randint(1, 50)

            # Mensaje
            mensaje = (
                f"Temp:{temperatura}C|"
                f"CPU:{uso_cpu}%|"
                f"RAM:{uso_ram}%|"
                f"LAT:{latencia}ms|"
                f"ORD:{ordenes}"
            )

            # Envío
            cliente_udp.sendto(
                mensaje.encode('utf-8'),
                (HOST, PORT)
            )

            print(f"Enviado (UDP): {mensaje}")

            time.sleep(0.5)

    except KeyboardInterrupt:

        print("\nAgente UDP detenido.")

    finally:

        cliente_udp.close()

if __name__ == "__main__":

    ejecutar_agente_udp()