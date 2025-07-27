import api from './api';

export const processOcrImages = async (frontImage: File, backImage: File) => {
  const formData = new FormData();
  console.log(frontImage)
  console.log(backImage)
  formData.append('frontImage', frontImage);
  formData.append('backImage', backImage);
for (let pair of formData.entries()) {
  console.log(pair[0], pair[1]);
}
  const response = await api.post('ocr/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  console.log(response.data)
  return response.data;
};
