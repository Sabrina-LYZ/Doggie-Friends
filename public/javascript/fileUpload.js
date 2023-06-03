
//register all plugins
FilePond.registerPlugin(
    FilePondPluginImagePreview,
    FilePondPluginImageResize,
    FilePondPluginFileEncode,
)

// FilePond.setOptions({
//     stylePanelAspectRatio:10/10,
//     imageResizeTargetWidth:10,
//     imageResizeTargetHeight:10,
// })
FilePond.parse(document.body);