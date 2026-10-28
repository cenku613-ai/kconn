# kconn

CLI tool to manage Kafka Connectors via the Kafka Connect REST API. Designed to run on OpenShift Kubernetes with Tekton Pipeline integration.

## Quick Start

### Local Usage

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
node dist/index.js --help

# List connectors
node dist/index.js list --server http://localhost:8083

# Create a connector
node dist/index.js create examples/jdbc-source.json --server http://localhost:8083

# Check status
node dist/index.js status jdbc-source --server http://localhost:8083

# JSON output (for scripting)
node dist/index.js list --output json | jq '.[].name'
```

### Environment Variables

| Variable | Description |
|---|---|
| `KCONN_SERVER` | Kafka Connect REST API URL |
| `KCONN_USERNAME` | Basic auth username |
| `KCONN_PASSWORD` | Basic auth password |
| `KCONN_OUTPUT` | Default output format (`table` or `json`) |

## Commands

| Command | Description |
|---|---|
| `kconn list [--expand] [--state X]` | List connectors |
| `kconn describe <name>` | Show connector details |
| `kconn config <name>` | Show connector config |
| `kconn status <name> [--tasks-only] [--task ID]` | Show connector/task status |
| `kconn tasks <name>` | List all tasks |
| `kconn topics <name> [--expand]` | Show connector topics |
| `kconn plugins` | List available plugins |
| `kconn create <file> [-n name] [--dry-run]` | Create connector from JSON/YAML |
| `kconn update <name> [-f file \| -s key=val]` | Update connector config |
| `kconn delete <name> [--yes]` | Delete connector |
| `kconn pause <name>` | Pause connector |
| `kconn resume <name>` | Resume connector |
| `kconn restart <name> [--include-tasks] [--only-failed]` | Restart connector |
| `kconn restart-task <name> <taskId>` | Restart a specific task |
| `kconn offsets <name>` | Show connector offsets |
| `kconn offsets-reset <name> [--yes]` | Reset connector offsets |
| `kconn validate <class> [--config file]` | Validate config against plugin |

## OpenShift Deployment

### 1. Build and Push the Container Image

```bash
# Build image
docker build -t quay.io/cen_ku/kconn:latest .

# Push to Quay
docker push quay.io/cen_ku/kconn:latest
```

### 2. Configure Server URL and Credentials

Edit the ConfigMap to set your Kafka Connect server URL:

```bash
# Using oc patch
oc patch configmap kconn-config -n openshift-pipelines \
  --type merge -p '{"data":{"KCONN_SERVER":"http://your-kafka-connect:8083"}}'

# Or create from file
oc apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: kconn-config
  namespace: openshift-pipelines
data:
  KCONN_SERVER: "http://your-kafka-connect:8083"
  KCONN_OUTPUT: "json"
EOF
```

Create the credentials Secret:

```bash
oc create secret generic kconn-credentials \
  --from-literal=KCONN_USERNAME=admin \
  --from-literal=KCONN_PASSWORD=your-password \
  -n openshift-pipelines
```

### 3. Deploy with Helm

```bash
helm install kconn ./deploy/helm \
  --namespace openshift-pipelines \
  --set kafkaConnect.serverUrl=http://your-kafka-connect:8083 \
  --set kafkaConnect.credentialsSecret=kconn-credentials
```

### 4. Deploy with Kustomize

```bash
# Edit deploy/kustomize/configmap.yaml and deploy/kustomize/secret.yaml first
oc apply -k deploy/kustomize/
```

## Tekton Pipeline Integration

### Install Tekton Tasks

Tasks are installed automatically via Helm. To install standalone:

```bash
oc apply -f tekton/tasks/ -n openshift-pipelines
```

### Run a Tekton Task

```bash
# List connectors (server URL and credentials come from ConfigMap/Secret)
tkn task start kconn-list -n openshift-pipelines

# Create a connector
tkn task start kconn-create \
  -p connector-config='{"name":"my-connector","config":{"connector.class":"..."}}' \
  -n openshift-pipelines

# Check status
tkn task start kconn-status \
  -p connector-name=jdbc-source \
  -n openshift-pipelines
```

### Run a Pipeline

```bash
# Install pipelines
oc apply -f tekton/pipelines/ -n openshift-pipelines

# Deploy a connector
tkn pipeline start connector-deploy \
  -p connector-config='{"name":"jdbc-source","config":{...}}' \
  -n openshift-pipelines

# Maintenance workflow (pause -> update -> resume)
tkn pipeline start connector-maintenance \
  -p connector-name=jdbc-source \
  -p config-changes='{"tasks.max":"4"}' \
  -n openshift-pipelines
```

### Available Tekton Tasks

| Task | Description | Results |
|---|---|---|
| `kconn-list` | List connectors | `connectors` (JSON array) |
| `kconn-describe` | Describe a connector | `connector-info` (JSON) |
| `kconn-status` | Get connector/task status | `status` (JSON) |
| `kconn-create` | Create a connector | `connector-name` |
| `kconn-update` | Update connector config | -- |
| `kconn-delete` | Delete a connector | -- |
| `kconn-pause` | Pause a connector | -- |
| `kconn-resume` | Resume a connector | -- |
| `kconn-restart` | Restart a connector | -- |
| `kconn-offsets` | Get/reset offsets | `offsets` (JSON) |
| `kconn-validate` | Validate config | `validation-result` (JSON) |

### Available Tekton Pipelines

| Pipeline | Flow |
|---|---|
| `connector-deploy` | Create -> Status Check -> Restart |
| `connector-maintenance` | Pause -> Update Config -> Resume -> Verify |

## Configuration Reference

### ConfigMap: `kconn-config`

| Key | Description | Default |
|---|---|---|
| `KCONN_SERVER` | Kafka Connect REST API URL | `http://kafka-connect:8083` |
| `KCONN_OUTPUT` | Default output format | `json` |

### Secret: `kconn-credentials`

| Key | Description |
|---|---|
| `KCONN_USERNAME` | Basic auth username |
| `KCONN_PASSWORD` | Basic auth password |

## Development

```bash
# Type check
npm run typecheck

# Build
npm run build

# Run in dev mode (hot reload)
npm run dev -- list --server http://localhost:8083

# Run tests
npm test
```
