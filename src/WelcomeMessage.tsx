import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

type Props = {
  name: string;
  uncompletedCount: number;
  onUpdateName: (newName: string) => void;
};

const WelcomeMessage = (props: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(props.name);

  const currentTime = new Date();
  const greeting =
    currentTime.getHours() < 12 ? "おはようございます" : "こんにちは";

  const handleSave = () => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0 && trimmed.length <= 20) {
      props.onUpdateName(trimmed);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setDraftName(props.name);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-blue-700 dark:text-blue-300">
      <span>{greeting}、</span>
      {isEditing ? (
        <span className="inline-flex items-center gap-1">
          <input
            type="text"
            value={draftName}
            maxLength={20}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className="w-36 rounded border border-blue-400 bg-white px-2 py-0.5 text-sm text-slate-800 dark:border-blue-500 dark:bg-slate-800 dark:text-slate-100"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            aria-label="名前を保存"
            className="cursor-pointer rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700"
          >
            <FontAwesomeIcon icon={faCheck} />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="キャンセル"
            className="cursor-pointer rounded bg-slate-400 px-2 py-0.5 text-xs text-white hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-bold">
          <span>{props.name}</span>
          <button
            type="button"
            onClick={() => {
              setDraftName(props.name);
              setIsEditing(true);
            }}
            aria-label="ユーザー名を編集"
            title="名前を変更"
            className="cursor-pointer rounded p-1 text-xs text-blue-500 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-slate-800 dark:hover:text-blue-300"
          >
            <FontAwesomeIcon icon={faPen} />
          </button>
        </span>
      )}
      <span>
        さん。現在の未完了タスクは<strong>{props.uncompletedCount}</strong>
        個です。
      </span>
    </div>
  );
};

export default WelcomeMessage;