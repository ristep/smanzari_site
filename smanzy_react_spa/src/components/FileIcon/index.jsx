import React from 'react';
import { File, FileText, FileArchive, Image, Video, FileMusic } from 'lucide-react';

const FileIcon = ({ mimeType, className, size = 24 }) => {
    if (!mimeType) return <File className={className} size={size} />;

    if (mimeType.startsWith('image/')) return <Image className={className} size={size} />;
    if (mimeType.startsWith('video/') || mimeType === 'video/youtube') return <Video className={className} size={size} />;
    if (mimeType.startsWith('audio/')) return <FileMusic className={className} size={size} />;
    if (mimeType.includes('pdf')) return <FileText className={className} size={size} />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className={className} size={size} />;

    return <File className={className} size={size} />;
};

export default FileIcon;
