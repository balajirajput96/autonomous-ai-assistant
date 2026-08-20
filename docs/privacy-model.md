# Privacy Model

## Privacy Commitment

The product will collect and process only the information required to provide the user-selected feature. Device-local content, server-processed content, and third-party processed content must be explained separately. The user must not have to infer whether an attachment, spoken input, task record, or connector permission leaves the device.

## Data Inventory

| Data Category | Purpose | Initial Storage Location | Sharing Boundary | User Control |
| --- | --- | --- | --- | --- |
| Conversation draft | Compose a request before submission. | Device-local. | None until sent. | Edit or clear. |
| Task metadata | Show history and diagnostic state. | Device-local in MVP; optional authenticated server later. | None in local mode. | View, clear, export when implemented. |
| Uploaded file | Analyse a document, image, or audio item only when user requests it. | Server object storage only after feature activation. | Model provider only if processing requires it. | Remove reference and explain current deletion boundary. |
| Voice recording | Convert speech to text only after microphone permission and user action. | Temporary upload only when transcription is activated. | Transcription provider when enabled. | Decline permission, delete task record, or use typed input. |
| Connector token | Perform explicitly approved connected-service actions. | Server-side encrypted secret store. | Only the authorised connected service. | Review scopes and revoke. |

## Disclosure and Consent

Google Play requires transparent disclosure of user-data access, collection, use, handling, and sharing. It also holds the developer responsible for the practices of third-party AI integrations. [1] The application will therefore present a just-in-time disclosure before remote processing, document third-party categories in the privacy policy, and keep user controls near their relevant data.

## Retention and Deletion

The MVP defaults to local task state and does not promise cross-device persistence. Remote file, memory, workflow, or connector capabilities remain unavailable until their retention and deletion implementation is verified. Future storage categories will receive a specified purpose, retention trigger, deletion path, and export scope before release.

## References

[1]: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en "User Data — Play Console Help"
