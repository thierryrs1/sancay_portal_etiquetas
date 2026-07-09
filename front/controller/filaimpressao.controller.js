sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/core/format/NumberFormat"],
  (BaseController, JSONModel, MessageBox, MessageToast, NumberFormat) =>
    BaseController.extend("sps.wms.controller.filaimpressao", {
      
      formatter: {
        statusText: function (statusCode) {
          const statusMap = {
            0: "Normal (Pronta)",
            1: "Pausada",
            2: "Erro",
            3: "Exclusão Pendente",
            4: "Atolamento de Papel",
            5: "Sem Papel",
            6: "Alimentação Manual",
            7: "Problema no Papel",
            8: "Offline",
            9: "IO Ativo",
            10: "Ocupada",
            11: "Imprimindo",
            12: "Bandeja de Saída Cheia",
            13: "Não Disponível",
            14: "Aguardando",
            15: "Processando",
            16: "Inicializando",
            17: "Aquecendo",
            18: "Toner Baixo",
            19: "Sem Toner",
            20: "Page Punt",
            21: "Intervenção do Usuário",
            22: "Sem Memória",
            23: "Porta Aberta",
            24: "Servidor Desconhecido",
            25: "Economia de Energia"
          };
          return statusMap[statusCode] || ("Desconhecido (" + statusCode + ")");
        },
        statusState: function (statusCode) {
          if (statusCode === 0 || statusCode === 11 || statusCode === 17) return "Success";
          if (statusCode === 1 || statusCode === 6 || statusCode === 25) return "Warning";
          return "Error";
        }
      },

      onInit: function () {
        this.getRouter().getRoute("filaimpressao").attachPatternMatched(this.onRouteMatched, this);
        this.setModel(new JSONModel({ Items: [] }), "Data");
      },

      onRouteMatched: async function () {
        await this.carregaDados();
      },

      carregaDados: async function () {
        try {
          sap.ui.core.BusyIndicator.show(0);
          const response = await this.serverService.post("/printer/getQueues", {});
          this.getModel("Data").setProperty("/Items", response);
        } catch (ex) {
          this.showExceptionMessageBox("Erro", "Erro ao buscar impressoras", ex);
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

      onClearQueue: async function (oEvent) {
        const rowData = oEvent.getSource().getBindingContext("Data").getProperty();
        const printerName = rowData.Name;

        MessageBox.confirm(`Tem certeza que deseja limpar a fila (cancelar todos os trabalhos) da impressora ${printerName}?`, {
            title: "Limpar Fila",
            onClose: async (oAction) => {
                if (oAction === MessageBox.Action.OK) {
                    try {
                        sap.ui.core.BusyIndicator.show(0);
                        await this.serverService.post("/printer/clearQueue", { printerName: printerName });
                        MessageToast.show(`Fila da impressora ${printerName} limpa com sucesso!`);
                        await this.carregaDados();
                    } catch (ex) {
                        this.showExceptionMessageBox("Erro", "Erro ao limpar fila", ex);
                    } finally {
                        sap.ui.core.BusyIndicator.hide();
                    }
                }
            }
        });
      }

    })
);
