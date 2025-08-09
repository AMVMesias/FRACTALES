# Visualizador Interactivo de Fractales - FractalLab

## Descripción del Proyecto

FractalLab es un visualizador interactivo de fractales desarrollado con WebGL que permite generar, visualizar y manipular fractales clásicos como el Conjunto de Mandelbrot, Conjunto de Julia, Curva de Koch, Triángulo de Sierpinski y Árbol Fractal Recursivo.

## Estructura del Proyecto

```
Proyecto/
├── index.html                      # Archivo principal HTML
├── assets/                         # Recursos estáticos
│   └── styles/
│       └── main.css               # Estilos principales
├── src/                           # Código fuente
│   ├── app.js                     # Aplicación principal
│   ├── utils/                     # Utilidades
│   │   ├── webgl-utils.js         # Utilidades WebGL
│   │   ├── math-utils.js          # Utilidades matemáticas
│   │   └── transform-utils.js     # Utilidades de transformación
│   ├── fractals/                  # Implementaciones de fractales
│   │   ├── base-fractal.js        # Clase base abstracta
│   │   ├── mandelbrot.js          # Conjunto de Mandelbrot
│   │   ├── julia.js               # Conjunto de Julia
│   │   ├── koch-curve.js          # Curva de Koch (por implementar)
│   │   ├── sierpinski.js          # Triángulo de Sierpinski (por implementar)
│   │   └── fractal-tree.js        # Árbol Fractal (por implementar)
│   └── ui/                        # Interfaz de usuario
│       ├── controls.js            # Controles de parámetros
│       ├── console.js             # Sistema de consola
│       └── performance-monitor.js # Monitor de rendimiento
└── README.md                      # Este archivo
```

## Características Implementadas

### ✅ Fractales Completados
- **Conjunto de Mandelbrot**: Implementación completa con coloreado suave
- **Conjunto de Julia**: Múltiples presets y constantes personalizables

### ✅ Funcionalidades Core
- **Navegación Interactiva**:
  - Pan con mouse/touch
  - Zoom con rueda del mouse o gestos de pellizco
  - Rotación con controles de teclado
  - Controles direccionales con matriz de botones

- **Controles de Parámetros**:
  - Número máximo de iteraciones (50-1000)
  - Radio de escape (1-10)
  - Nivel de zoom (científico con notación exponencial)
  - Centro de coordenadas
  - Rotación (0-360°)

- **Interfaz Científica**:
  - Panel de parámetros con sliders y campos de entrada
  - Monitor de rendimiento en tiempo real
  - Consola de debug con logs categorizados
  - Métricas estadísticas del fractal

- **Exportación**:
  - Captura de imagen (PNG)
  - Exportación de datos de sesión (JSON)
  - Guardado de configuraciones

### ✅ Tecnologías WebGL
- Shaders GLSL para renderizado en GPU
- Manejo eficiente de memoria WebGL
- Detección y manejo de errores WebGL
- Soporte para extensiones de precisión flotante

## Arquitectura del Código

### Patrón de Diseño
El proyecto utiliza un patrón de arquitectura modular con las siguientes capas:

1. **Capa de Aplicación** (`app.js`): Coordinador principal
2. **Capa de Fractales** (`fractals/`): Implementaciones específicas
3. **Capa de Utilidades** (`utils/`): Funciones auxiliares reutilizables
4. **Capa de UI** (`ui/`): Interfaz de usuario y controles

### Clase Base BaseFractal
Todas las implementaciones de fractales heredan de `BaseFractal` que proporciona:
- Inicialización de shaders WebGL
- Manejo de parámetros comunes
- Renderizado base
- Exportación/importación de datos
- Cálculo de estadísticas

### Sistema de Transformaciones
`TransformUtils` proporciona:
- **Viewport**: Manejo de cámara virtual con animaciones suaves
- **InputHandler**: Procesamiento de eventos de mouse y touch
- **KeyboardHandler**: Atajos de teclado para navegación

### Utilidades Matemáticas
`MathUtils` incluye:
- Operaciones con números complejos
- Vectores 2D y matrices de transformación
- Funciones de mapeo de coordenadas
- Utilidades de color y interpolación

## Controles de Usuario

### Navegación
- **Mouse/Touch**: Arrastra para hacer pan
- **Rueda del Mouse**: Zoom in/out
- **Doble Click**: Zoom in centrado
- **Gestos de Pellizco**: Zoom en dispositivos touch

### Teclado
- **WASD/Flechas**: Navegación direccional
- **Q/E**: Rotación
- **Ctrl + +/-**: Zoom
- **Ctrl + R**: Reset vista

### Interfaz
- **Sliders**: Ajuste de parámetros en tiempo real
- **Matriz de Navegación**: Botones direccionales
- **Selector de Fractales**: Cambio entre tipos de fractal
- **Botones de Acción**: Exportar, guardar, capturar

## Parámetros de Configuración

### Parámetros Comunes
- **Max Iterations**: Número máximo de iteraciones (50-1000)
- **Escape Radius**: Radio de escape para la divergencia (1-10)
- **Zoom Level**: Nivel de magnificación (notación científica)
- **Center**: Coordenadas del centro de la vista
- **Rotation**: Rotación de la vista en grados

### Parámetros Específicos de Julia
- **Constant C (Real)**: Parte real de la constante compleja
- **Constant C (Imaginary)**: Parte imaginaria de la constante compleja
- **Presets**: Conjuntos predefinidos famosos

## Métricas de Rendimiento

### Métricas Monitoreadas
- **FPS**: Frames por segundo en tiempo real
- **Render Time**: Tiempo de renderizado por frame
- **Memory Usage**: Uso de memoria JavaScript
- **GPU Usage**: Estimación de uso de GPU
- **Convergence**: Ratio de convergencia del fractal

### Estadísticas de Fractal
- **Fractal Dimension**: Dimensión fractal estimada
- **Boundary Points**: Número de puntos en el borde
- **Area Ratio**: Proporción de área del conjunto

## Próximas Implementaciones

### 🔄 Fractales Pendientes
- **Curva de Koch**: Sistema L-System
- **Triángulo de Sierpinski**: Implementación recursiva
- **Árbol Fractal**: Generación procedural

### 🔄 Características Avanzadas
- Paletas de colores personalizables
- Animaciones temporales
- Modo de comparación lado a lado
- Historial de navegación
- Marcadores de puntos de interés

## Uso del Proyecto

### Requisitos
- Navegador web moderno con soporte WebGL
- JavaScript habilitado

### Instalación
1. Clona o descarga el proyecto
2. Abre `index.html` en un navegador web
3. La aplicación se inicializará automáticamente

### Desarrollo
Para desarrollo local, se recomienda usar un servidor HTTP local:
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx http-server

# Con VS Code Live Server
# Instalar extensión Live Server y usar "Go Live"
```

## Tecnologías Utilizadas

- **WebGL**: Renderizado acelerado por GPU
- **GLSL**: Shaders para cálculos de fractales
- **JavaScript ES6+**: Lógica de aplicación
- **CSS Grid**: Layout responsivo
- **HTML5 Canvas**: Superficie de renderizado

## Contribuciones

El proyecto está estructurado para facilitar la adición de nuevos fractales:

1. Crear nueva clase que herede de `BaseFractal`
2. Implementar métodos abstractos requeridos
3. Agregar shaders GLSL específicos
4. Registrar en la aplicación principal

## Licencia

Proyecto educativo para curso de Gráficas por Computadora.

---

**Desarrollado con ❤️ para el aprendizaje de gráficas computacionales y visualización científica.**
