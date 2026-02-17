# Flow Integration System

This project includes an automated flow integration system that handles node sequences.

## Available Flow Chains


### Chain 1: flow_trigger-c0c1139a-458f-43ec-b958-4db580778785_1771079855016
- **Nodes**: form → http → run-javascript → navigate
- **Node Count**: 4
- **Chain Type**: linear


### Chain 2: flow_trigger-583d14fc_1771079855017
- **Nodes**: form → if-conditional → http → run-javascript → navigate
- **Node Count**: 5
- **Chain Type**: conditional


### Chain 3: flow_page-load-1770835954478_1771079855017
- **Nodes**: page-load → openaiAgentSDKNode → structured-output-parser → script-event
- **Node Count**: 4
- **Chain Type**: linear


### Chain 4: flow_page-load-1770834098560_1771079855018
- **Nodes**: page-load → http
- **Node Count**: 2
- **Chain Type**: linear


### Chain 5: flow_google-sheets-trigger-1770831498824_1771079855018
- **Nodes**: google-sheets-trigger → db-api-post → json-string-parser → Telegram Send Message → openaiAgentSDKNode
- **Node Count**: 5
- **Chain Type**: linear


### Chain 6: flow_page-load-1770832545541_1771079855019
- **Nodes**: page-load → db-api-get → script-event → script-event → script-event → script-event
- **Node Count**: 6
- **Chain Type**: linear


### Chain 7: flow_page-load-1770785967661_1771079855019
- **Nodes**: page-load → http → data-table
- **Node Count**: 3
- **Chain Type**: linear


### Chain 8: flow_page-load-1770973857046_1771079855019
- **Nodes**: page-load → http → script-event → script-event → script-event
- **Node Count**: 5
- **Chain Type**: linear


### Chain 9: flow_script-event-1771077760003_1771079855020
- **Nodes**: script-event
- **Node Count**: 1
- **Chain Type**: linear


### Chain 10: flow_button-1771079809740_1771079855020
- **Nodes**: button → http
- **Node Count**: 2
- **Chain Type**: linear


### Chain 11: flow_timer-1770029212572_1771079855020
- **Nodes**: timer → openaiAgentSDKNode → Telegram Send Message
- **Node Count**: 3
- **Chain Type**: linear


### Chain 12: flow_timer-1770024151262_1771079855021
- **Nodes**: timer → openaiAgentSDKNode
- **Node Count**: 2
- **Chain Type**: linear


### Chain 13: flow_telegram-inbound-1770014553742_1771079855021
- **Nodes**: telegram-inbound → openaiAgentSDKNode → Telegram Send Message
- **Node Count**: 3
- **Chain Type**: linear


### Chain 14: flow_openaiAgentSDKNode-1770014701913_1771079855021
- **Nodes**: openaiAgentSDKNode
- **Node Count**: 1
- **Chain Type**: linear


### Chain 15: flow_openaiAgentSDKNode-1770014706694_1771079855021
- **Nodes**: openaiAgentSDKNode
- **Node Count**: 1
- **Chain Type**: linear


### Chain 16: flow_whatsapp-trigger-1770013817891_1771079855022
- **Nodes**: whatsapp-trigger → openaiAgentSDKNode → whatsapp-business → script-event
- **Node Count**: 4
- **Chain Type**: linear


## Usage

The flow system is automatically initialized when the application loads. You can execute flows using:

```javascript
// Execute all flows
const results = await executeAllFlows({
  formData: { name: 'John', email: 'john@example.com' },
  context: 'user_action'
});

// Execute a specific flow chain
const specificResult = await executeSpecificFlow('flow_trigger-c0c1139a-458f-43ec-b958-4db580778785_1771079855016', {
  data: 'input_data'
});

// Get information about available flows
const flowInfo = getFlowChainInfo();
console.log('Available flows:', flowInfo);
```

## Integration with Forms

Forms automatically trigger their connected flow chains when submitted. The flow system handles:

- **Data Collection**: Gathering form data from input fields
- **AI Processing**: Processing data through OpenAI Agent SDK nodes
- **UI Updates**: Updating headings, paragraphs, and other UI elements
- **API Calls**: Making requests to external services
- **Integration Events**: Triggering Slack, email, and other integrations

## Flow Chain Types

- **Linear**: Simple A → B → C sequences
- **Branching**: Flows that split into multiple paths
- **Merging**: Multiple inputs combining into one flow
- **Conditional**: Flows with decision points

## Debugging

Enable debugging by setting:

```javascript
window.localStorage.setItem('flow-debug', 'true');
```

This will provide detailed console logs of flow execution.
