import { supabase } from './supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (antes da compressão)
const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.82;

/**
 * Redimensiona e comprime a imagem no navegador para reduzir peso de upload/armazenamento.
 */
const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_WIDTH / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível.'));
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao comprimir imagem.'))),
          'image/jpeg',
          JPEG_QUALITY
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao converter imagem.'));
    reader.readAsDataURL(blob);
  });

/**
 * Envia a imagem de capa da tarefa para o Supabase Storage (bucket "materials", pasta "task-covers").
 * Se o storage estiver indisponível, retorna a imagem comprimida como data URL (fallback local).
 */
export const uploadTaskCover = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem (JPG, PNG, WEBP...).');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('A imagem deve ter no máximo 10MB.');
  }

  // GIFs mantêm o arquivo original para preservar animação
  const blob: Blob = file.type === 'image/gif' ? file : await compressImage(file);
  const ext = file.type === 'image/gif' ? 'gif' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 40);
  const filePath = `task-covers/${Date.now()}_${baseName}.${ext}`;

  try {
    const { data, error } = await supabase.storage.from('materials').upload(filePath, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type === 'image/gif' ? 'image/gif' : 'image/jpeg'
    });

    if (!error && data) {
      const { data: urlData } = supabase.storage.from('materials').getPublicUrl(data.path);
      if (urlData?.publicUrl) return urlData.publicUrl;
    } else {
      console.warn('Upload de capa no Storage falhou, usando fallback local:', error?.message);
    }
  } catch (err) {
    console.warn('Storage indisponível para capa da tarefa, usando fallback local:', err);
  }

  return blobToDataUrl(blob);
};
