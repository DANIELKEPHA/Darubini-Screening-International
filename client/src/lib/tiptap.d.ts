import '@tiptap/core'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontColor: {
            setFontColor: (color: string) => ReturnType
            unsetFontColor: () => ReturnType
        }
    }
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontSize: {
            setFontSize: (size: string) => ReturnType
            unsetFontSize: () => ReturnType
        }
    }
}
