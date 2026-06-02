interface Props {
    params: {
        cognitoId: string;
    };
}

export default function UserProfile({ params }: Props) {
    const cognitoId = params.cognitoId;

    return (
        <div>
            Viewing user: {cognitoId}
        </div>
    );
}