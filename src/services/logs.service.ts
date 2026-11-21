import Axios from 'axios';
import { env } from './envfile';

const getAuthToken = () => {
  const currentUserString = localStorage.getItem('currentUser');
  if (currentUserString) {
    try {
      const currentUser = JSON.parse(currentUserString);
      return currentUser.token;
    } catch {
      return null;
    }
  }
  return null;
};

export interface CampoAlteradoItem {
  campo: string;
  label: string;
  antes: any;
  depois: any;
}

export interface LogAuditoriaItem {
  idLog: number;
  dataHora: string;
  idUsuario: number | null;
  nomeUsuario: string | null;
  emailUsuario: string | null;
  acao: 'CRIACAO' | 'ATUALIZACAO' | 'EXCLUSAO' | 'LOGIN' | 'ACAO' | string;
  modulo: string;
  entidade: string;
  idRegistro: string | null;
  resumo: string;
  metodoHttp: string | null;
  rota: string | null;
  ip: string | null;
  dadosAnteriores: any;
  dadosNovos: any;
  camposAlterados: CampoAlteradoItem[];
  statusHttp: number | null;
  idRequisicao: string | null;
}

export interface ListarLogsParams {
  page?: number;
  limit?: number;
  busca?: string;
  modulo?: string;
  acao?: string;
  entidade?: string;
  idUsuario?: number | null;
  dataInicio?: string;
  dataFim?: string;
}

export interface ListarLogsResponse {
  items: LogAuditoriaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  resumo: {
    totalGeral: number;
    criacoes: number;
    atualizacoes: number;
    exclusoes: number;
    logins: number;
    acoes: number;
  };
  filtrosDisponiveis: {
    modulos: string[];
    usuarios: { idUsuario: number; nomeUsuario: string; emailUsuario: string | null }[];
  };
}

export const buscarLogs = async (params: ListarLogsParams) => {
  const cleanParams: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      cleanParams[k] = v;
    }
  });

  return await Axios({
    method: 'GET',
    url: `${env.BASE_URL}/logs`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    params: cleanParams,
  });
};

export const buscarLogPorId = async (idLog: number) => {
  return await Axios({
    method: 'GET',
    url: `${env.BASE_URL}/logs/${idLog}`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
};
