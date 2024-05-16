export const definedVariables = [
  {
    'PAYMENTS_PER_MINUTE': {
      'type': {  "$schema": "http://json-schema.org/draft-07/schema#", "type": "integer" },
      'defaultValue': 1000000,
    }
  }, {
    'SHIPMENTS_PER_MINUTE': {
      'type': {  "$schema": "http://json-schema.org/draft-07/schema#", "type": "integer" },
      'defaultValue': 1000000,
    }
  }, {
    'PAYMENT_PROCESSING_TIME': {
      'type': {  "$schema": "http://json-schema.org/draft-07/schema#", "type": "integer" },
      'defaultValue': 5,
    }
  }, {
    'SHIPMENT_PROCESSING_TIME': {
      'type': {  "$schema": "http://json-schema.org/draft-07/schema#", "type": "integer" },
      'defaultValue': 5,
    }
  }, {
    'PAYMENT_SUCCESS_RATE': {
      'type': {  "$schema": "http://json-schema.org/draft-07/schema#", "type": "number" },
      'defaultValue': 0.95,
    }
  }, {
    'SHIPMENT_SUCCESS_RATE': {
      'type': {  "$schema": "http://json-schema.org/draft-07/schema#", "type": "number" },
      'defaultValue': 0.95,
    }
  }
]