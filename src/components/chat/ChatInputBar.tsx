import { Clock3, Mic, Plus, Send } from 'lucide-react';
import { useState } from 'react';

interface ChatInputBarProps { isLoading: boolean; onSend: (value: string) => void; }

export const ChatInputBar = ({ isLoading, onSend }: ChatInputBarProps) => {
  const [value, setValue] = useState('');
  const submit = () => {
    const next = value.trim();
    if (!next || isLoading) return;
    onSend(next);
    setValue('');
  };

  return (
    <div className="input-dock">
      <div className="chat-input-bar">
        <button type="button" aria-label="Đính kèm"><Plus size={21} /></button>
        <button type="button" aria-label="Lịch sử"><Clock3 size={19} /></button>
        <input value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') submit(); }} placeholder="Hỏi bất kỳ điều gì..." disabled={isLoading} />
        <button type="button" className={value.trim() ? 'input-send active' : 'input-send'} onClick={value.trim() ? submit : undefined} aria-label={value.trim() ? 'Gửi' : 'Ghi âm'}>
          {value.trim() ? <Send size={18} /> : <Mic size={19} />}
        </button>
      </div>
    </div>
  );
};
