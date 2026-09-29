interface AuthPaneProps {
    title: string;
    description: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

/** Frames the sign-in / sign-up forms. */
export const AuthPane = ({ title, description, children, footer }: AuthPaneProps) => {
    return (
        <div className="w-full max-w-sm">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
            {footer && (
                <p className="mt-8 text-sm text-muted-foreground">
                    {footer}
                </p>
            )}
        </div>
    );
};
