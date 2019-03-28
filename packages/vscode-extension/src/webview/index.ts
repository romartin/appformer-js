/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AppFormerSubmarine } from "appformer-js-submarine";
import { AppFormerGwtEditor, BusinessCentralClientEditorFactory } from "./AppFormerGwtEditor";

//Exposed API of AppFormerGwt
declare global {
  interface Window {
    gwtEditorBeans: Map<string, BusinessCentralClientEditorFactory>;
    appFormerGwtFinishedLoading: () => any;
    erraiBusApplicationRoot: string;
  }
}

function loadGwtEditor(gwtModuleName: string): Promise<void> {
  const script = document.createElement("script");
  script.src = `${window.erraiBusApplicationRoot}/${gwtModuleName}/${gwtModuleName}.nocache.js`;
  document.body.appendChild(script);
  return Promise.resolve();
}

function messageHandler(appFormer: AppFormerSubmarine, event: any) {
  const message = event.data;
  const editor = appFormer.getEditor();

  if (!editor) {
    console.info(`Message was received when no editor was registered: "${message.type}"`);
    return Promise.resolve();
  }

  switch (message.type) {
    case "RETURN_SET_CONTENT":
      return editor.setContent(message.data);
    case "REQUEST_GET_CONTENT":
      return editor.getContent().then(content => appFormer.postMessage({ type: "RETURN_GET_CONTENT", data: content }));
    default:
      return Promise.resolve();
  }
}

function removeWorkbenchHeaderPanel() {
  const elementById = document.getElementById("workbenchHeaderPanel");
  if (elementById) {
    const parentNode = elementById.parentNode as HTMLElement;
    if (parentNode) {
      parentNode.remove();
    }
  }
}

AppFormerSubmarine.init(document.getElementById("app")!).then(appFormer => {
  window.erraiBusApplicationRoot = "http://localhost:8080";
  window.appFormerGwtFinishedLoading = () => {
    removeWorkbenchHeaderPanel();
    appFormer
      //FIXME: Make request to appformer-js-router with file path as argument.
      //FIXME: Use data received from appformer-js-router to create AppFormerGwtEditor.
      .registerEditor(() => new AppFormerGwtEditor("DMNDiagramEditor"))
      .then(() => appFormer.handleMessages(messageHandler))
      .then(() => appFormer.postMessage({ type: "REQUEST_SET_CONTENT", data: undefined }));
  };

  return loadGwtEditor("org.kie.workbench.common.dmn.showcase.DMNShowcase");
});
