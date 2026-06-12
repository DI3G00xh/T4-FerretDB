# Despliegue Taller 4 - Diego Adaos


# Chatbot IA Local con Persistencia y Streaming - Taller 4

Este proyecto es una aplicación web full-stack diseñada para implementar un sistema de chat interactivo asistido por Inteligencia Artificial de ejecución local. La arquitectura destaca por integrar la persistencia completa del historial en una base de datos documental ferretDB (alternativa a MongoDB) , la retención autónoma de la memoria conversacional y la optimización de los tiempos de respuesta mediante streaming en tiempo real usando Server-Sent Events (SSE). Una vez configurado, el sistema funciona completamente sin conexión a internet.

---

## Arquitectura Tecnológica
* **Frontend:** React (Vite)  + Lucide Icons para una interfaz SPA reactiva y adaptada al flujo de mensajes
* **Backend:** Node.js (Express) estructurado como API REST de control de contexto y emisor de eventos SSE.
* **Base de Datos:** FerretDB  respaldada por un motor relacional PostgreSQL 16 integrado en un contenedor Docker.
* **IA Local:** Ollama ejecutando el modelo optimizado Phi-3 de forma nativa en la máquina anfitriona
* **Infraestructura:** Docker Compose para el aislamiento y portabilidad del entorno.

---

## Arquitectura Estructural del Proyecto

A continuación se detalla la jerarquía y el flujo de comunicación de los componentes basándose en la disposición del directorio raíz de trabajo:

```text
  Taller4-FerretDB/
  ├── docker-compose.yml          # Configuración de FerretDB + PostgreSQL
  ├── backend/                    # SERVIDOR MODULARizado
  │   ├── config/
  │   │   └── db.js               # Conexión a la base de datos
  │   ├── controllers/
  │   │   └── chatController.js   # Lógica de Ollama, SSE y consultas
  │   ├── routes/
  │   │   └── chatRoutes.js       # Definición de los endpoints (/api/chat, etc.)
  │   └──index.js                # Punto de entrada 
  │  
  └── frontend/                   # INTERFAZ EN REACT (VITE)
      └── src/
          ├── App.jsx             # Componente principal de la interfaz
          ├── App.css            
          └── main.jsx            

```

## Requisitos Previos
Tener instalado:
* [Node.js](https://nodejs.org/) (Versión 18 o superior)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [Ollama](https://ollama.com/)

---

## Pasos para Montar el Proyecto

### 1. Descargar y Ejecutar el Modelo de IA Local
1. Abrir una terminal con Ollama activo en segundo plano.
2. Descargar y ejecuta el modelo ligero phi3 ingresando el siguiente comando:
  ```bash
  ollama run phi3
  ```
3. Una vez finalizada la descarga,se puede cerrar o salir de la consola del modelo escribiendo /exit. El modelo quedará disponible de manera local para el backend

### 2. Levantar la Base de Datos Documental con Docker
Desde la terminal en la raíz del proyecto, ejecutar el siguiente comando para descargar e iniciar el contenedor de MonetDB en segundo plano:
```bash
docker-compose up -d
```

### 3. Levantar el Backend (NestJS)
1. Abrir una nueva terminal y navegar a la carpeta del servidor:
   ```bash
   cd backend
   ```
2. Instalar las dependencias del proyecto (Express, CORS, MongoDB Driver):
   ```bash
   npm install
   ```
3. Iniciar el servidor backend:
   ```bash
   node index.js
   ```
> El backend estará disponible en: \`http://localhost:3000\`

### 4. Levantar el Frontend (React)
1. Abrir una nueva terminal y navegar a la carpeta de la interfaz:
   ```bash
   cd frontend
   ```
2. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Iniciar la aplicación web:
   ```bash
   npm run dev
   ```
> El dashboard interactivo se abrirá en: \`http://localhost:5173\`

---

## Instrucciones de Uso de la Aplicación

1. **Persistencia Automatizada e Historial:** Cada mensaje enviado o generado se almacena de inmediato en la colección documental con sus campos mínimos obligatorios: _id, rol (user o assistant), contenido y fechaHora. Si cierras o recargas la pestaña de tu navegador, la aplicación ejecutará una consulta ordenada de forma ascendente devolviendo la conversación completa en un estricto orden cronológico.
2. **Streaming de Tokens en Tiempo Real (SSE):** Al enviar una pregunta, se habilitará un indicador de carga animado. Al instante, la respuesta del modelo phi3 comenzará a pintarse progresivamente palabra por palabra en la pantalla. El sistema utiliza la infraestructura de Server-Sent Events para evitar esperas por bloques de texto completos.
3. **Manejo de Memoria Conversacional:** El chatbot recuerda el contexto inmediato y los mensajes anteriores gracias a que el backend inyecta de manera ordenada el historial de FerretDB en la ventana del prompt.
4. **Diferenciación Visual y Limpieza:** Los mensajes están estructurados en burbujas con alineaciones opuestas y colores distintos según su emisor (user con avatares de usuario y assistant con avatares de bot). Asimismo, la barra superior cuenta con el botón "Nueva Conversación", el cual ejecuta una instrucción DELETE en el backend para vaciar la colección de la base de datos y reiniciar el contexto a cero de forma segura.
```
