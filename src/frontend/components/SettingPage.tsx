import React, { useEffect, useReducer } from 'react';
import { AlertMode } from '../../common/types/alert-mode';
import { IUser } from '../../common/types/user';
import { Visibility } from '../../common/types/visibility';
import { useGetSessionQuery } from '../services/session';
import { defaultTemplate } from '../../common/default-template';

type SettingDraftType = Pick<IUser,
	| 'alertMode'
	| 'visibility'
	| 'localOnly'
	| 'remoteFollowersOnly'
	| 'template'
>;

type DraftReducer = React.Reducer<SettingDraftType, Partial<SettingDraftType>>;

export const SettingPage: React.VFC = () => {
	const session = useGetSessionQuery(undefined);

	const data = session.data;

	const [draft, dispatchDraft] = useReducer<DraftReducer>((state, action) => {
		return { ...state, ...action };
	}, {
		alertMode: data?.alertMode ?? 'note',
		visibility: data?.visibility ?? 'public',
		localOnly: data?.localOnly ?? false,
		remoteFollowersOnly: data?.remoteFollowersOnly ?? false,
		template: data?.template ?? null,
	});

	useEffect(() => {
		if (data) {
			dispatchDraft({
				alertMode: data.alertMode,
				visibility: data.visibility,
				localOnly: data.localOnly,
				remoteFollowersOnly: data.remoteFollowersOnly,
				template: data.template,
			});
		}
	}, [session.data]);

	return session.isLoading || !data ? (
		<div className="skeleton" style={{width: '100%', height: '128px'}}></div>
	) : (
		<div className="vstack">
			<div>
				<label htmlFor="alertMode" className="input-field">スコア通知方法</label>
				<select name="alertMode" className="input-field" value={draft.alertMode} onChange={(e) => {
					dispatchDraft({ alertMode: e.target.value as AlertMode });
				}}>
					<option value="note">自動的にノートを投稿</option>
					<option value="notification">Misskeyに通知(標準)</option>
					<option value="nothing">通知しない</option>
				</select>
				{draft.alertMode === 'notification' && (
					<div className="alert bg-danger mt-2">
						<i className="icon bi bi-exclamation-circle"></i>
						「Misskey に通知」オプションは古いMisskeyでは動作しません。
					</div>
				)}
			</div>
			{ draft.alertMode === 'note' && (
				<div>
					<label htmlFor="visibility" className="input-field">公開範囲</label>
					<select name="visibility" className="input-field" value={draft.visibility} onChange={(e) => {
						dispatchDraft({ visibility: e.target.value as Visibility });
					}}>
						<option value="public">パブリック</option>
						<option value="home">ホーム</option>
						<option value="followers">フォロワー</option>
					</select>
					<label className="input-switch mt-2">
						<input type="checkbox" />
						<div className="switch"></div>
						<span>ローカル限定</span>
					</label>
				</div>
			)}
			<div>
				<label htmlFor="template" className="input-field">テンプレート</label>
				<textarea className="input-field" value={draft.template ?? defaultTemplate} style={{height: 256}} onChange={(e) => {
					dispatchDraft({ template: e.target.value });
				}} />
			</div>
			<button className="btn primary">
				設定を保存する
			</button>
		</div>
	);
};
