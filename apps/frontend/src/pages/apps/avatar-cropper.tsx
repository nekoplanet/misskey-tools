import { sessionAtom } from '@/store/api/session';
import { modalAtom } from '@/store/client-state';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { ChangeEventHandler, ReactEventHandler, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { centerCrop, Crop, makeAspectCrop } from 'react-image-crop';

import 'react-image-crop/dist/ReactCrop.css';
import { useTitle } from '../../hooks/useTitle';

export const NekomimiPage: React.FC = () => {
	const setModal = useSetAtom(modalAtom);
  const session = useAtomValue(sessionAtom);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [percentage, setPercentage] = useState(0);
  const [isUploading, setUploading] = useState(false);
  const [crop, setCrop] = useState<Crop>();

  const {t} = useTranslation();
  useTitle('catAdjuster');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

	const onImageLoad: ReactEventHandler<HTMLImageElement> = (e) => {
		const { naturalWidth: width, naturalHeight: height } = e.currentTarget;

		const crop = centerCrop(
			makeAspectCrop({
				unit: '%',
				width: 90,
			}, 1 / 1, width, height),
			width,
			height
		);
		setCrop(crop);
	}

  const beginUpload = async () => {
    if (!previewCanvasRef.current) return;
    if (!session) return;

    const canvas = previewCanvasRef.current;
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res));
    if (!blob) return;

    const formData = new FormData();
    formData.append('i', session.token);
    formData.append('force', 'true');
    formData.append('file', blob);
    formData.append('name', `(Cropped) ${fileName ?? 'File'}`);

    await new Promise<void>((res, rej) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://${session.host}/api/drive/files/create`, true);
      xhr.onload = () => {
        setPercentage(100);
        const {id: avatarId} = JSON.parse(xhr.responseText);
        fetch(`https://${session.host}/api/i/update`, {
          method: 'POST',
					'headers': {
				   'Content-Type': 'application/json',
					},
          body: JSON.stringify({ i: session.token, avatarId }),
        }).then(() => res()).catch(rej);
      };
      xhr.onerror = rej;
      xhr.upload.onprogress = e => {
        setPercentage(Math.floor(e.loaded / e.total * 100));
      };
      xhr.send(formData);
    });

    setModal({
      type: 'dialog',
      icon: 'info',
      message: t('saved'),
    });
  };

  const onChangeFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files === null || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    setFileName(file.name);
    reader.addEventListener('load', () => setBlobUrl(reader.result as string));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
		const image = imageRef.current;
    if (!crop || !previewCanvasRef.current || !image) {
      return;
    }

    const canvas = previewCanvasRef.current;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
  }, [crop]);

  const onClickUpload = async () => {
    setUploading(true);
    setPercentage(0);
    try {
      await beginUpload();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fade">
      <h2>{t('catAdjuster')}</h2>
      <input type="file" className="input-field" accept="image/*" onChange={onChangeFile} />
      {blobUrl && (
        <div className="row mt-2">
          <div className="col-8 col-12-sm">
            <ReactCrop crop={crop} aspect={1 / 1} onChange={(c) => setCrop(c)}>
							<img ref={imageRef} src={blobUrl} onLoad={onImageLoad} />
						</ReactCrop>
          </div>
          <div className="col-4 col-12-sm">
            <h3 className="text-100 text-bold">{t('preview')}</h3>
            <div className="cat mt-4 mb-2" style={{position: 'relative', width: 96, height: 96}}>
              <canvas
                ref={previewCanvasRef}
                className="circle"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 100,
                }}
              />
            </div>
            <button className="btn primary" onClick={onClickUpload} disabled={isUploading}>
              {isUploading ? `${percentage}%` : t('upload')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

