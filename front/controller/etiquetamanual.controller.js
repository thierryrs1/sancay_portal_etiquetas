sap.ui.define([
  "sps/wms/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/Label",
  "sap/m/Input",
  "sap/m/PDFViewer"
], function (BaseController, JSONModel, Label, Input, PDFViewer) {
  "use strict";

  return BaseController.extend("sps.wms.controller.etiquetamanual", {
      
      onInit: function () {
          this.getRouter().getRoute("etiquetamanual").attachPatternMatched(this._onRouteMatched, this);
          this.setModel(new JSONModel({
              Tipos: [],
              Impressoras: [],
              Fields: [],
              Values: {},
              HasProcedure: false,
              Parametro: ""
          }), "Config");
      },

      _onRouteMatched: async function () {
          this.getView().setBusy(true);
          try {
              // Busca os tipos filtrados pelas permissões do usuário
              let tipos = await this.serverService.get("/etiqueta/getTiposEtiquetaManual");
              this.getModel("Config").setProperty("/Tipos", tipos);

              // Busca as impressoras do primeiro tipo selecionado, se houver
              if (tipos.length > 0) {
                  this.byId("selTipoEtq").setSelectedKey(tipos[0].tipoEtq);
                  await this._carregaImpressoras(tipos[0].tipoEtq);
                  
                  if (tipos[0].procedure) {
                      this.getModel("Config").setProperty("/HasProcedure", true);
                      this.getModel("Config").setProperty("/Fields", []);
                      this.byId("formFields").removeAllContent();
                  } else {
                      this.getModel("Config").setProperty("/HasProcedure", false);
                      await this._geraCamposDinamicos(tipos[0].pathPrn);
                  }
              } else {
                  this.getModel("Config").setProperty("/Fields", []);
                  this.byId("formFields").removeAllContent();
              }
          } catch (e) {
              this.showExceptionMessageBox("Erro", "Erro ao carregar configurações", e);
          }
          this.getView().setBusy(false);
      },

      onTipoChange: async function(oEvent) {
          const tipoSel = oEvent.getParameter("selectedItem").getKey();
          const tipos = this.getModel("Config").getProperty("/Tipos");
          const tipoObj = tipos.find(t => t.tipoEtq === tipoSel);
          
          if (tipoObj) {
              this.getModel("Config").setProperty("/Parametro", "");
              await this._carregaImpressoras(tipoSel);
              if (tipoObj.procedure) {
                  this.getModel("Config").setProperty("/HasProcedure", true);
                  this.getModel("Config").setProperty("/Fields", []);
                  this.byId("formFields").removeAllContent();
              } else {
                  this.getModel("Config").setProperty("/HasProcedure", false);
                  await this._geraCamposDinamicos(tipoObj.pathPrn);
              }
          }
      },

      _carregaImpressoras: async function(tipoEtiqueta) {
          try {
              let imps = await this.serverService.get("/configuraImpressao/getTipoImps");
              imps = imps.filter(i => i.tipoEtq === tipoEtiqueta);
              this.getModel("Config").setProperty("/Impressoras", imps);
              if (imps.length > 0) {
                  this.byId("selImpressora").setSelectedKey(imps[0].impressora);
              }
          } catch(e) {}
      },

      _geraCamposDinamicos: async function(prn, procData) {
          const form = this.byId("formFields");
          form.removeAllContent();
          
          const tipoSel = this.byId("selTipoEtq").getSelectedKey();
          let bdTags = [];
          try {
              if (tipoSel) {
                  bdTags = await this.serverService.post("/configuraImpressao/getTags", { tipoEtq: tipoSel });
              }
          } catch (e) {
              console.error("Erro carregando tags", e);
          }
          
          // Regex para encontrar <tags>
          const regex = /<([^>]+)>/g;
          let match;
          const fields = [];
          const values = {};
          
          while ((match = regex.exec(prn)) !== null) {
              const tag = match[1];
              if (!fields.includes(tag)) {
                  fields.push(tag);
                  values[tag] = "";
              }
          }
          
          this.getModel("Config").setProperty("/Fields", fields);
          
          for (let i = 0; i < fields.length; i++) {
              const f = fields[i];
              let isReadOnly = false;
              if (procData) {
                  const key = Object.keys(procData).find(k => k.toUpperCase() === f.toUpperCase());
                  if (key && procData[key] !== null && procData[key] !== "") {
                      values[f] = procData[key];
                      isReadOnly = true;
                  }
              }
              
              form.addContent(new Label({ text: f }));
              
              const tagConfig = bdTags.find(b => b.tag === f);
              if (!isReadOnly && tagConfig && tagConfig.consulta) {
                  // É um dropdown
                  const cb = new sap.m.ComboBox({
                      selectedKey: "{Config>/Values/" + f + "}",
                      width: "100%",
                      showSecondaryValues: true,
                      filterSecondaryValues: true
                  });
                  try {
                      const items = await this.serverService.post("/etiqueta/executaQueryDinamica", { query: tagConfig.consulta });
                      const modelName = "Dropdown_" + f;
                      this.setModel(new sap.ui.model.json.JSONModel(items), modelName);
                      
                      let keyCol = "Key";
                      let textCol = "Text";
                      if (items && items.length > 0) {
                          const cols = Object.keys(items[0]);
                          if (cols.length > 0) keyCol = cols[0];
                          if (cols.length > 1) textCol = cols[1];
                          else textCol = keyCol;
                      }
                      
                      cb.bindItems({
                          path: modelName + ">/",
                          template: new sap.ui.core.ListItem({
                              key: "{" + modelName + ">" + keyCol + "}",
                              text: "{" + modelName + ">" + keyCol + "}",
                              additionalText: "{" + modelName + ">" + textCol + "}"
                          })
                      });
                  } catch (e) {
                      console.error("Erro carregando dropdown " + f, e);
                  }
                  form.addContent(cb);
              } else {
                  form.addContent(new Input({ 
                      value: "{Config>/Values/" + f + "}",
                      editable: !isReadOnly
                  }));
              }
          }
          
          this.getModel("Config").setProperty("/Values", values);
      },

      onBuscarProcedure: async function() {
          const parametro = this.getModel("Config").getProperty("/Parametro");
          const tipoSel = this.byId("selTipoEtq").getSelectedKey();
          const tipos = this.getModel("Config").getProperty("/Tipos");
          const tipoObj = tipos.find(t => t.tipoEtq === tipoSel);
          
          if (!parametro) {
              this.showErrorMessageBox("Atenção", "Preencha o parâmetro de busca.");
              return;
          }
          
          this.getView().setBusy(true);
          try {
              const result = await this.serverService.post("/etiqueta/executaProcedureManual", {
                  procedure: tipoObj.procedure,
                  parametro: parametro
              });
              
              await this._geraCamposDinamicos(tipoObj.pathPrn, result);
              this.showSuccessMessageBox("Sucesso", "Dados carregados.");
          } catch(e) {
              this.showExceptionMessageBox("Erro", "Erro ao buscar dados", e);
          }
          this.getView().setBusy(false);
      },

      onPrint: async function(visualizar) {
          const tipo = this.byId("selTipoEtq").getSelectedKey();
          const impressora = this.byId("selImpressora").getSelectedKey();
          const tipos = this.getModel("Config").getProperty("/Tipos");
          const tipoObj = tipos.find(t => t.tipoEtq === tipo);
          
          if (!tipo || !tipoObj) {
              this.showErrorMessageBox("Atenção", "Selecione um tipo de etiqueta.");
              return;
          }
          if (!impressora && !visualizar) {
              this.showErrorMessageBox("Atenção", "Selecione uma impressora.");
              return;
          }

          const values = this.getModel("Config").getProperty("/Values");
          let prnFinal = tipoObj.pathPrn;
          
          // Replace tags
          Object.keys(values).forEach(k => {
              const regex = new RegExp("<" + k + ">", "g");
              prnFinal = prnFinal.replace(regex, values[k] || "");
          });

          this.getView().setBusy(true);
          try {
              const payload = {
                  impressora: impressora || "",
                  tipoEtiqueta: tipo,
                  prnFinal: prnFinal,
                  visualizar: visualizar,
                  jsonData: values
              };
              
              if (visualizar) {
                  const pdfName = await this.serverService.post("/etiqueta/imprimeManual", payload);
                  this.openPDF(pdfName);
              } else {
                  await this.serverService.post("/etiqueta/imprimeManual", payload);
                  this.showSuccessMessageBox("Enviado", "Enviado para impressão!");
              }
          } catch(e) {
              this.showExceptionMessageBox("Erro", "Erro ao imprimir", e);
          }
          this.getView().setBusy(false);
      },

      openPDF: async function (pdfName) {
          const pdfViewer = new PDFViewer();
          this.getView().addDependent(pdfViewer);
          pdfViewer.setSource(pdfName);
          pdfViewer.setTitle("Pré-Visualização de Etiqueta");
          pdfViewer.setVisible(true);
          pdfViewer.open(); 
      },

      onNavBack: function () {
          this.getRouter().navTo("home");
      }
  });
});
