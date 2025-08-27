export async function getRawFormFields (request: Request) {
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}
