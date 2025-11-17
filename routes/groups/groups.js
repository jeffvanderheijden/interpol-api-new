import postHandler from "./_post.js";

export default async function handler(req, res) {
  const method = req.method.toUpperCase();

  switch (method) {
    case "POST":
      return postHandler(req, res);

    // case "GET":
    //   return getHandler(req, res);

    // case "PATCH":
    // case "PUT":
    //   return updateHandler(req, res);

    // case "DELETE":
    //   return deleteHandler(req, res);

    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}
