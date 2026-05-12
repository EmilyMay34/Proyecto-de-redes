import socket
import pandas as pd
import time

def ejecutar_agente_tcp():
    # Configuracion de red
    HOST = '127.0.0.1'
    PORT = 12000

    try:
        # 1. Ingesta y modelado de datos 
        print("Cargando y uniendo tablas (Clientes + Órdenes + Ítems + Productos)...")
        df_clientes = pd.read_csv('olist_customers_dataset.csv')
        df_ordenes = pd.read_csv('olist_orders_dataset.csv')
        df_items = pd.read_csv('olist_order_items_dataset.csv')
        df_productos = pd.read_csv('olist_products_dataset.csv')

        # JOIN 1: Se une lientes con sus ordenes (usando customer_id)
        df_paso1 = pd.merge(df_clientes, df_ordenes, on='customer_id')
        
        # JOIN 2: Se une con los items para tener el Precio (Usando order_id)
        # Esto es clave para el Data Warehouse
        df_paso2 = pd.merge(df_paso1, df_items, on='order_id')

        # ORDENAMIENTO: Por fecha de compra
        df_ordenado = df_paso2.sort_values(by='order_purchase_timestamp')

        # 2. Socket TCP
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as cliente_tcp:
            cliente_tcp.connect((HOST, PORT))
            print(f"Conectado al servidor TCP en {HOST}:{PORT}")

            # 3. Envio de datos línea por línea
            for i, fila in df_ordenado.head(100).iterrows():
                #Se obtiene  la categoria del producto usando el product_id de la tabla items
                # Se buscaen la tabla de productos el nombre real
                producto_info = df_productos[df_productos['product_id'] == fila['product_id']]
                
                # Si existe el producto se saca su categoría, si no, se pone  'General'
                categoria = producto_info['product_category_name'].values[0] if not producto_info.empty else "General"
                precio = fila['price'] # Dato nuevo gracias al 4to archivo
                
                # Construccion del registro mas completo (ID, Ciudad, Fecha, Categoria,Precio)
                # Agregamos el precio al final para que el Dashboard lo pueda graficar
                registro = f"{fila['customer_id']}|{fila['customer_city']}|{fila['order_purchase_timestamp']}|{categoria}|{precio}\n"
                
                # Envoo codificado
                cliente_tcp.sendall(registro.encode('utf-8'))
                
                print(f"Enviado (TCP): {fila['order_purchase_timestamp']} | {categoria} | ${precio}")
                
                # Pausa de 1 segundo para simular trafico real
                time.sleep(1)

    except FileNotFoundError as e:
        print(f"Error: No se encontró el archivo {e.filename}")
    except ConnectionRefusedError:
        print("Error: El servidor no está encendido.")

if __name__ == "__main__":
    ejecutar_agente_tcp()