# CRM de formularios → Google Sheets

Los cuatro formularios (alta de negocio, anúnciate, sponsor y contacto) siguen
avisando por email como hasta ahora. Esta conexión es aparte y **está apagada**:
la función de Netlify no envía nada mientras `SHEETS_WEBHOOK_URL` esté vacía.
No hay cuenta de servicio de Google ni credenciales en el repositorio, y el ID
de la hoja no va en el código.

Cada envío añade una fila a la pestaña **Leads**, con estas columnas y en este
orden:

Fecha · Formulario · Negocio · Slug ficha · Contacto · Email · Teléfono · Mensaje · Origen/UTM · Estado · Notas

Estado entra siempre como «Nuevo». Notas recoge el resto de campos del
formulario (categoría, zona, plan, la dirección que haya escrito quien envía el
alta, etc.). Slug y UTM solo se rellenan si vienen en el envío.

## Qué tienes que hacer (John)

1. Crea una hoja de cálculo de Google, o abre la que ya uses de CRM. El nombre
   del fichero da igual. No hace falta compartirla.
2. En esa hoja: **Extensiones → Apps Script**. Tiene que ser el script de la
   propia hoja, no un proyecto suelto de script.google.com: así el código
   encuentra la hoja sin un ID.
3. Borra el `function myFunction()` de ejemplo y pega todo el contenido de
   [`docs/crm-apps-script.gs`](crm-apps-script.gs). Guarda (el nombre del
   proyecto puede ser «CRM elcanaveral»).
4. **Implementar → Nueva implementación → Tipo: Aplicación web**.
   - Ejecutar como: **Yo** (tu cuenta de Google).
   - Quién tiene acceso: **Cualquier persona**.
     Hace falta para que el servidor de Netlify pueda llamar sin iniciar sesión.
     La URL larga es el secreto: no la pegues en el repositorio, en un issue ni
     en un chat.
5. Autoriza el permiso cuando Google lo pida (escribir en tus hojas).
6. Copia la URL de la aplicación web, la que termina en `/exec`.
7. En Netlify, en el sitio de elcanaveral.info: **Site configuration →
   Environment variables → Add a variable**.
   - Key: `SHEETS_WEBHOOK_URL`
   - Value: esa URL (`https://script.google.com/macros/s/…/exec`)
   - Márcala como secreto si el panel lo ofrece.
   - Contextos: **Production** basta. Añade **Deploy Previews** solo si quieres
     que las pruebas del preview también escriban en la hoja.
8. Vuelve a desplegar el sitio (Deploys → Trigger deploy → Deploy site) para
   que la función vea la variable.
9. Envía el formulario de contacto de la web con un email tuyo. En la hoja debe
   aparecer la pestaña **Leads** (se crea sola la primera vez) y una fila con
   estado «Nuevo». El email de aviso de Netlify tiene que seguir llegando: no
   cambies esas notificaciones.

Para dejarlo otra vez apagado, borra `SHEETS_WEBHOOK_URL` (o déjala vacía) y
redespliega. Los formularios y los emails no dependen de ella.

No actives a la vez el webhook de notificaciones de Netlify hacia la misma URL:
la fila se duplicaría. Con la variable de entorno es suficiente. El script
también entiende el evento crudo de Netlify por si más adelante se usa ese
webhook en lugar de la función, no además.

Si cambias el código del script, en Apps Script hay que publicar una
**nueva implementación** (o editar la existente) para que la URL `/exec` coja
la versión nueva. Guardar el script no actualiza el despliegue solo.

No reordenes las columnas de la fila 1. Las filas nuevas se escriben siempre
en el orden de arriba. Puedes cambiar Estado y Notas a mano en las filas ya
creadas: el script no las pisa.
