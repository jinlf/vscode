/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { Event } from 'vs/base/common/event';
import { DisposableStore } from 'vs/base/common/lifecycle';
import { mock } from 'vs/base/test/common/mock';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { TestConfigurationService } from 'vs/platform/configuration/test/common/testConfigurationService';
import { ExtensionKind, IEnvironmentService } from 'vs/platform/environment/common/environment';
import { ExtensionIdentifier, IExtension, IRelaxedExtensionDescription } from 'vs/platform/extensions/common/extensions';
import { IFileService } from 'vs/platform/files/common/files';
import { TestInstantiationService, createServices } from 'vs/platform/instantiation/test/common/instantiationServiceMock';
import { ILogService, NullLogService } from 'vs/platform/log/common/log';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { TestNotificationService } from 'vs/platform/notification/test/common/testNotificationService';
import product from 'vs/platform/product/common/product';
import { IProductService } from 'vs/platform/product/common/productService';
import { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { NullTelemetryService } from 'vs/platform/telemetry/common/telemetryUtils';
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity';
import { UriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentityService';
import { IUserDataProfilesService, UserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IWorkspaceTrustEnablementService } from 'vs/platform/workspace/common/workspaceTrust';
import { IWebExtensionsScannerService, IWorkbenchExtensionEnablementService, IWorkbenchExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement';
import { BrowserExtensionHostKindPicker } from 'vs/workbench/services/extensions/browser/extensionService';
import { AbstractExtensionService } from 'vs/workbench/services/extensions/common/abstractExtensionService';
import { ExtensionHostKind, ExtensionRunningPreference } from 'vs/workbench/services/extensions/common/extensionHostKind';
import { IExtensionHostManager } from 'vs/workbench/services/extensions/common/extensionHostManager';
import { ExtensionManifestPropertiesService, IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService';
import { ExtensionRunningLocation } from 'vs/workbench/services/extensions/common/extensionRunningLocation';
import { IExtensionHost, IExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle';
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService';
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile';
import { WorkspaceTrustEnablementService } from 'vs/workbench/services/workspaces/common/workspaceTrust';
import { TestEnvironmentService, TestFileService, TestLifecycleService, TestRemoteAgentService, TestRemoteExtensionsScannerService, TestUserDataProfileService, TestWebExtensionsScannerService, TestWorkbenchExtensionEnablementService, TestWorkbenchExtensionManagementService } from 'vs/workbench/test/browser/workbenchTestServices';
import { TestContextService } from 'vs/workbench/test/common/workbenchTestServices';

suite('BrowserExtensionService', () => {
	test('pickRunningLocation', () => {
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation([], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation([], false, true, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation([], true, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation([], true, true, ExtensionRunningPreference.None), null);

		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui'], true, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);

		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace'], true, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);

		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);


		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'workspace'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'workspace'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'workspace'], true, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'workspace'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'ui'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'ui'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'ui'], true, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'ui'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);

		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'workspace'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'workspace'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'workspace'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'workspace'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'web'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'web'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'web'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'web'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);

		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'web'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'web'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'web'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'web'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'ui'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'ui'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'ui'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'ui'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);


		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'web', 'workspace'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'web', 'workspace'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'web', 'workspace'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'web', 'workspace'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'workspace', 'web'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'workspace', 'web'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'workspace', 'web'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['ui', 'workspace', 'web'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);

		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'ui', 'workspace'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'ui', 'workspace'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'ui', 'workspace'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'ui', 'workspace'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'workspace', 'ui'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'workspace', 'ui'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'workspace', 'ui'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['web', 'workspace', 'ui'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);

		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'ui', 'web'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'ui', 'web'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'ui', 'web'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'ui', 'web'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'web', 'ui'], false, false, ExtensionRunningPreference.None), null);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'web', 'ui'], false, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'web', 'ui'], true, false, ExtensionRunningPreference.None), ExtensionHostKind.LocalWebWorker);
		assert.deepStrictEqual(BrowserExtensionHostKindPicker.pickRunningLocation(['workspace', 'web', 'ui'], true, true, ExtensionRunningPreference.None), ExtensionHostKind.Remote);
	});
});

suite('ExtensionService', () => {

	class MyTestExtensionService extends AbstractExtensionService {
		private _extHostId = 0;
		public readonly order: string[] = [];
		protected _pickExtensionHostKind(extensionId: ExtensionIdentifier, extensionKinds: ExtensionKind[], isInstalledLocally: boolean, isInstalledRemotely: boolean, preference: ExtensionRunningPreference): ExtensionHostKind | null {
			throw new Error('Method not implemented.');
		}
		protected override _doCreateExtensionHostManager(extensionHost: IExtensionHost, isInitialStart: boolean, initialActivationEvents: string[]): IExtensionHostManager {
			const order = this.order;
			const extensionHostId = ++this._extHostId;
			order.push(`create ${extensionHostId}`);
			return new class extends mock<IExtensionHostManager>() {
				override onDidExit = Event.None;
				override onDidChangeResponsiveState = Event.None;
				override dispose(): void {
					order.push(`dispose ${extensionHostId}`);
				}
				override representsRunningLocation(runningLocation: ExtensionRunningLocation): boolean {
					return extensionHost.runningLocation.equals(runningLocation);
				}
			};
		}
		protected _createExtensionHost(runningLocation: ExtensionRunningLocation, isInitialStart: boolean): IExtensionHost | null {
			return new class extends mock<IExtensionHost>() {
				override runningLocation = runningLocation;
			};
		}
		protected _scanAndHandleExtensions(): Promise<void> {
			throw new Error('Method not implemented.');
		}
		protected _scanSingleExtension(extension: IExtension): Promise<Readonly<IRelaxedExtensionDescription> | null> {
			throw new Error('Method not implemented.');
		}
		protected _onExtensionHostExit(code: number): void {
			throw new Error('Method not implemented.');
		}
	}

	let disposables: DisposableStore;
	let instantiationService: TestInstantiationService;
	let extService: MyTestExtensionService;

	setup(() => {
		disposables = new DisposableStore();
		instantiationService = createServices(disposables, [
			// custom
			[IExtensionService, MyTestExtensionService],
			// default
			[ILifecycleService, TestLifecycleService],
			[IWorkbenchExtensionManagementService, TestWorkbenchExtensionManagementService],
			[INotificationService, TestNotificationService],
			[IRemoteAgentService, TestRemoteAgentService],
			[ILogService, NullLogService],
			[IWebExtensionsScannerService, TestWebExtensionsScannerService],
			[IExtensionManifestPropertiesService, ExtensionManifestPropertiesService],
			[IConfigurationService, TestConfigurationService],
			[IWorkspaceContextService, TestContextService],
			[IProductService, { _serviceBrand: undefined, ...product }],
			[IFileService, TestFileService],
			[IWorkbenchExtensionEnablementService, TestWorkbenchExtensionEnablementService],
			[ITelemetryService, NullTelemetryService],
			[IEnvironmentService, TestEnvironmentService],
			[IWorkspaceTrustEnablementService, WorkspaceTrustEnablementService],
			[IUserDataProfilesService, UserDataProfilesService],
			[IUserDataProfileService, TestUserDataProfileService],
			[IUriIdentityService, UriIdentityService],
			[IRemoteExtensionsScannerService, TestRemoteExtensionsScannerService],
		]);
		extService = <MyTestExtensionService>instantiationService.get(IExtensionService);
	});

	teardown(() => {
		disposables.dispose();
	});

	test('issue #152204: Remote extension host not disposed after closing vscode client', async () => {
		await extService.startExtensionHosts();
		extService.stopExtensionHosts();
		assert.deepStrictEqual(extService.order, (['create 1', 'create 2', 'create 3', 'dispose 3', 'dispose 2', 'dispose 1']));
	});
});
