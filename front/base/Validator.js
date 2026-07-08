/* eslint-disable no-undef */
sap.ui.define(
  [
    'sap/ui/base/Object',
    'jquery.sap.global',
    'sap/ui/model/SimpleType',
    'sap/ui/model/ValidateException',
  ],
  (Object, SimpleType, ValidateException) => Object.extend('sps.wms.base.Validator', {
    /**
       * Valida se os campos recebidos estão vazios
       * @param {oInput} aInputs campos a serem validados
       * @public
       */
    validateEmptyFields(aInputs) {
      let bValidationError = false;

      // check that inputs are not empty
      // this does not happen during data binding as this is only triggered by changes
      jQuery.each(aInputs, (i, oInput) => {
        const oBinding = oInput.getBinding('value');
        try {
          oBinding.getType().validateValue(oInput.getValue());
          oInput.setValueStateText('');
          oInput.setValueState('None');
        } catch (oException) {
          oInput.setValueStateText('Campo obrigatório');
          oInput.setValueState('Error');
          bValidationError = true;
        }
      });

      return bValidationError;
    },
  }),
);
