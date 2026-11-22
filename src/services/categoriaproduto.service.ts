import Axios from "axios";
import { env } from "./envfile";

const getAuthToken = () => {
  const currentUserString = localStorage.getItem("currentUser");
  if (currentUserString) {
    const currentUser = JSON.parse(currentUserString);
    return currentUser.token;
  }
  return null;
};

export const buscarCategorias = async () => {
  const options = {
    method: "GET",
    url: `${env.BASE_URL}/categoriaproduto/ativos`,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};

export const cadastrarCategoria = async (data: { nome: string; ativo?: boolean }) => {
  const options = {
    method: "POST",
    url: `${env.BASE_URL}/categoriaproduto`,
    data: {
      nome: (data.nome || '').trim(),
      ativo: data.ativo === false ? false : true,
    },
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    }
  };

  return await Axios(options);
};
