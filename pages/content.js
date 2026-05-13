export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/guides',
      permanent: true,
    },
  };
}

export default function ContentRedirect() {
  return null;
}
