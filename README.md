# Visualizador Interativo de Rotas e Grafos

Aplicação web completa para visualização, manipulação e cálculo de **menor caminho**
em grafos, com animação do algoritmo de **Dijkstra** em tempo real.

**Stack:**
- **Banco de Dados:** MySQL (tabelas `vertices` e `arestas`)
- **Back-end:** Python + FastAPI + mysql-connector-python (Dijkstra implementado manualmente)
- **Front-end:** HTML5 e JavaScript puro (Vanilla JS) com `<canvas>` nativo

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Visualização do grafo | Vértices como círculos (ID + nome) e arestas dirigidas com setas e peso |
| Cálculo de rota | Algoritmo de Dijkstra manual, ignorando arestas bloqueadas |
| Animação | Nós explorados piscam em **amarelo**; caminho ótimo destacado em **verde** com custo total |
| Criar vértices | Clique em área vazia do canvas para criar um ponto (salvo no MySQL) |
| Bloquear arestas | Clique sobre uma aresta para bloquear/desbloquear (fica vermelha tracejada) |
| CRUD via API | Endpoints REST para grafo, vértices, arestas e bloqueio |

---

## Estrutura do Projeto

```
grafo-rotas/
├── backend/
│   ├── main.py            # API FastAPI + algoritmo de Dijkstra
│   └── bd.sql         # Criação do banco + dados iniciais
└── frontend/
    ├── index.html         # Estrutura da página
    └── script.js          # Canvas, animação e consumo da API
```

---

## Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/grafo` | Retorna vértices e arestas do grafo completo |
| `GET` | `/rota?origem=X&destino=Y` | Dijkstra → `caminho`, `visitados` (ordem de exploração) e `custo_total` |
| `POST` | `/vertices` | Cria vértice `{nome, pos_x, pos_y}` |
| `POST` | `/arestas` | Cria aresta `{origem_id, destino_id, peso}` |
| `PATCH` | `/arestas/{id}/bloquear` | Alterna bloqueio da aresta |

**Exemplo de resposta de `/rota`:**

```json
{
  "caminho": [1, 2, 4, 7],
  "visitados": [1, 3, 2, 4, 6, 5, 7],
  "custo_total": 24
}
```

---

## Como Usar

1. **Calcular rota:** selecione Origem e Destino nos `<select>` e clique em **Calcular Rota**.
2. **Animação:** os nós visitados pelo Dijkstra piscam em amarelo; ao final, o caminho
   ótimo fica verde e o custo total é exibido.
3. **Criar vértice:** clique em uma área vazia do canvas e informe o nome.
4. **Bloquear aresta:** clique sobre a linha da aresta — ela fica vermelha tracejada
   e é excluída dos próximos cálculos de rota.
5. **Limpar:** o botão **Limpar Destaques** remove a rota exibida.

---

## Sobre o Dijkstra Implementado

- Constrói a **lista de adjacência** a partir das arestas não bloqueadas no MySQL.
- Utiliza **min-heap** (`heapq`) para extração do vértice de menor distância.
- Registra a **ordem exata de exploração** para animação no front-end.
- Reconstrói o caminho ótimo via mapa de predecessores.
- Sem dependências de bibliotecas de grafos (NetworkX etc.).

---

## Solução de Problemas

| Problema | Solução |
|---|---|
| `Access denied` ao rodar o schema | Confira usuário/senha do MySQL |
| Front-end não carrega o grafo | Verifique se o back-end está em `localhost:8000` |
| Erro de CORS | Confirme que o middleware CORS está ativo em `main.py` |
| Rota não encontrada | Pode haver arestas bloqueadas desconectando o grafo |
