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
              Values: {}
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
                  this._geraCamposDinamicos(tipos[0].pathPrn);
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
              await this._carregaImpressoras(tipoSel);
              this._geraCamposDinamicos(tipoObj.pathPrn);
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

      _geraCamposDinamicos: function(prn) {
          const form = this.byId("formFields");
          form.removeAllContent();
          
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
          this.getModel("Config").setProperty("/Values", values);
          
          fields.forEach(f => {
              form.addContent(new Label({ text: f }));
              form.addContent(new Input({ 
                  value: "{Config>/Values/" + f + "}" 
              }));
          });
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
