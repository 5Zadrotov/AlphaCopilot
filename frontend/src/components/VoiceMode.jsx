import React, {useState, useRef} from 'react';
import {Button, message, Space, Typography } from 'antd';
import{AudioOutlined} from '@ant-design/icons';
import './VoiceMode.css';

const{Text} = Typography;

const VoiceMode = ({onAudioUpload}) =>{
    const[record, setRecord] = useState(false);
    const[audioURL, setAudioURL] = useState(null);
    const[audiofile, setAudioFile] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecord = async() =>{
        try{
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) =>{
                chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const file = new Blob(chunksRef.current, {type: 'audio/webm'});
                const url = URL.createObjectURL(file);
                setAudioFile(file);
                setAudioURL(url);
                onAudioUpload?.(file);
                message.success("Аудио записано")
            };

            mediaRecorder.start();
            setRecord(true);
            message.info("Запись аудио...");
        }
        catch(error)
        {
            message.error("Не удалось получить доступ к микрофону");
            console.log(error);
        }

        const stopRecord = () => {
            if(mediaRecorderRef.current && record)
            {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                setRecord(false);
            }
        };

        const voiceToggle = () => {
            if(record)
            {
                stopRecord();
            }
            else{
                startRecord();
            }
        };

        const resetRecord = () =>
        {
            setAudioURL(null);
            setAudioFile(null);
            URL.revokeObjectURL(audioURL);
        }
        return (
           <div className="voice-mode">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="voice-recorder">
          <Button
            type={record? 'primary' : 'default'}
            icon={<AudioOutlined />}
            size="large"
            onClick={voiceToggle}
            danger={record}
            className="voice-button"
            block
          >
            {record ? 'Остановить запись' : 'Начать запись голоса'}
          </Button>

          {audioURL && (
            <div className="audio-preview">
              <audio controls src={audioURL} style={{ width: '100%', marginTop: 12 }} />
              <Button
                size="small"
                onClick={resetRecord}
                style={{ marginTop: 8 }}
              >
                Очистить
              </Button>
            </div>
          )}
        </div>

        <Text type="secondary" className="voice-hint">
          Нажмите кнопку, чтобы записать голосовое сообщение. Поддерживается до 1 минуты.
        </Text>
      </Space>
    </div>
        )

    }

}
export default VoiceMode;