# Prompt Base Para Cambios Visuales de MediConnect

Actua como frontend engineer senior y arquitecto de interfaces para MediConnect.

Objetivo:
Mantener una experiencia visual coherente, elegante y transversal en toda la aplicacion, desde la landing publica hasta login, registro y paneles autenticados.

Reglas obligatorias:

- No disenar pantallas aisladas. Cada cambio debe sentirse parte del mismo sistema visual.
- Mantener el lenguaje health-tech actual: limpio, luminoso, azul dominante, tarjetas suaves, bordes redondeados, sombras ligeras y atmosfera confiable.
- Priorizar continuidad de experiencia: el usuario no debe sentir que salto a otro producto entre landing, autenticacion y panel interno.
- Reutilizar patrones visuales:
  - fondos con gradientes suaves
  - blobs o luces difusas sutiles
  - tarjetas blancas o traslucidas con bordes suaves
  - iconografia azul y estados claros
  - composiciones con bloques informativos tipo mini card
- Toda navegacion publica debe favorecer scroll natural y lectura progresiva cuando aplique.
- En login y registro siempre debe existir salida clara para volver al inicio publico.
- Las mejoras visuales deben ser transversales: actualizar tambien layout autenticado, encabezados, fondos y contenedores principales cuando sea necesario.
- Evitar apariencia generica o de dashboard plano.
- No romper integraciones existentes con backend.
- Cuando una vista aun no tenga datos reales, conservar coherencia visual sin inventar comportamientos falsos.

Checklist por cada cambio:

1. Verificar continuidad con landing, auth y app interna.
2. Revisar navegacion de ida y vuelta.
3. Revisar consistencia de tipografia, sombras, radios y espaciados.
4. Revisar responsive basico.
5. Revisar que el flujo siga conectado a backend o deje claro si aun no lo esta.
6. Compilar frontend y validar backend si el cambio toca integracion.

Resultado esperado:

- Una aplicacion que se vea como un solo producto.
- Una experiencia comercial al inicio y operativa despues del login, sin quiebres de presentacion.
