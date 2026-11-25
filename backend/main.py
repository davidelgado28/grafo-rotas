from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "sua_senha",  
    "database": "grafo_rotas",
}

app = FastAPI(title="Visualizador de Rotas e Grafos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

def query(sql, params=(), one=False):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return (rows[0] if rows else None) if one else rows

def execute(sql, params=()):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    conn.close()
    return new_id

class VerticeIn(BaseModel):
    nome: str
    pos_x: int
    pos_y: int

class ArestaIn(BaseModel):
    origem_id: int
    destino_id: int
    peso: int = 1

@app.get("/grafo")
def get_grafo():
    return {
        "vertices": query("SELECT * FROM vertices ORDER BY id"),
        "arestas":  query("SELECT * FROM arestas  ORDER BY id"),
    }
@app.post("/vertices", status_code=201)
def add_vertice(v: VerticeIn):
    vid = execute(
        "INSERT INTO vertices (nome, pos_x, pos_y) VALUES (%s, %s, %s)",
        (v.nome, v.pos_x, v.pos_y),
    )
    return {"id": vid, **v.model_dump()}

@app.post("/arestas", status_code=201)
def add_aresta(a: ArestaIn):
    """Cria uma nova aresta dirigida."""
    for ref, col in ((a.origem_id, "origem"), (a.destino_id, "destino")):
        if not query("SELECT id FROM vertices WHERE id=%s", (ref,), one=True):
            raise HTTPException(404, f"Vértice de {col} {ref} não existe")
    aid = execute(
        "INSERT INTO arestas (origem_id, destino_id, peso) VALUES (%s, %s, %s)",
        (a.origem_id, a.destino_id, a.peso),
    )
    return {"id": aid, **a.model_dump()}

@app.patch("/arestas/{aresta_id}/bloquear")
def toggle_bloqueio(aresta_id: int, bloqueada: Optional[bool] = None):
    atual = query("SELECT bloqueada FROM arestas WHERE id=%s", (aresta_id,), one=True)
    if not atual:
        raise HTTPException(404, "Aresta não encontrada")
    novo = (not atual["bloqueada"]) if bloqueada is None else bloqueada
    execute("UPDATE arestas SET bloqueada=%s WHERE id=%s", (novo, aresta_id))
    return {"id": aresta_id, "bloqueada": novo}

def dijkstra(origem: int, destino: int):
    vertices = {v["id"]: v for v in query("SELECT * FROM vertices")}
    if origem not in vertices or destino not in vertices:
        raise HTTPException(404, "Vértice de origem ou destino inexistente")

    adj = {vid: [] for vid in vertices}
    for e in query("SELECT * FROM arestas WHERE bloqueada = FALSE"):
        adj[e["origem_id"]].append((e["destino_id"], e["peso"]))

    import math, heapq
    dist    = {vid: math.inf for vid in vertices}
    prev    = {vid: None   for vid in vertices}
    dist[origem] = 0

    heap = [(0, origem)]          
    settled = set()
    visitados = []                

    while heap:
        d, u = heapq.heappop(heap)          
        if u in settled:
            continue
        settled.add(u)
        visitados.append(u)                 

        if u == destino:                    
            break

        for v, peso in adj[u]:              
            if v in settled:
                continue
            nd = d + peso
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))

    if dist[destino] == math.inf:
        return None, visitados, -1
    caminho, node = [], destino
    while node is not None:
        caminho.append(node)
        node = prev[node]
    caminho.reverse()
    return caminho, visitados, dist[destino]

@app.get("/rota")
def calcular_rota(origem: int, destino: int):
    caminho, visitados, custo = dijkstra(origem, destino)
    return {"caminho": caminho, "visitados": visitados, "custo_total": custo}
