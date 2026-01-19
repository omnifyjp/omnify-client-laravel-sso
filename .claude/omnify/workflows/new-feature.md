# New Feature Workflow

> Step-by-step guide for implementing a complete feature (Backend + Frontend).

## Overview

```mermaid
flowchart LR
    Schema --> Generate --> Migrate --> Backend --> Tests --> OpenAPI --> Frontend
```

| Step | Command/Action        | Output                                  |
| ---- | --------------------- | --------------------------------------- |
| 1    | Create schema         | `.omnify/schemas/{Module}/{Model}.yaml` |
| 2    | `npx omnify generate` | Migration + Types + Requests            |
| 3    | `./artisan migrate`   | Database tables                         |
| 4    | Create Backend        | Model, Controller, Resource, Routes     |
| 5    | Write Tests           | `tests/Feature/Api/*Test.php`           |
| 6    | `./artisan test`      | All tests pass                          |
| 7    | Add OpenAPI           | Swagger documentation                   |
| 8    | Build Frontend        | Service, Hooks, Components              |

---

## Step 1: Schema

Create `.omnify/schemas/{Module}/{Model}.yaml`:

```yaml
# .omnify/schemas/Blog/Post.yaml
name: Post
tableName: posts
properties:
  title:
    type: String
    maxLength: 255
  content:
    type: Text
  user_id:
    type: ForeignId
    references: users
  published_at:
    type: DateTime
    nullable: true
options:
  timestamps: true
```

> **Guide**: [guides/omnify/schema-guide.md](../guides/omnify/schema-guide.md)

---

## Step 2-3: Generate & Migrate

```bash
npx omnify generate          # Generate migration + types
./artisan migrate            # Create database tables
```

**Verify**:
- [ ] Check `database/migrations/omnify/` for new migration
- [ ] Check `frontend/src/types/model/` for TypeScript types

---

## Step 4: Backend Implementation

### 4.1 Model

```php
// app/Models/Post.php
class Post extends PostBaseModel
{
    // $fillable, $casts inherited from base
    
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }
}
```

### 4.2 Controller (Thin!)

```php
// app/Http/Controllers/PostController.php
class PostController extends Controller
{
    public function index(Request $request)
    {
        $posts = Post::with('author')
            ->when($request->search, fn($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->paginate($request->input('per_page', 15));
        
        return PostResource::collection($posts);
    }
    
    public function store(PostStoreRequest $request): PostResource
    {
        $post = Post::create($request->validated());
        return new PostResource($post);
    }
    
    public function show(Post $post): PostResource
    {
        return new PostResource($post->load('author'));
    }
    
    public function update(PostUpdateRequest $request, Post $post): PostResource
    {
        $post->update($request->validated());
        return new PostResource($post);
    }
    
    public function destroy(Post $post): Response
    {
        $post->delete();
        return response()->noContent();
    }
}
```

### 4.3 Resource

```php
// app/Http/Resources/PostResource.php
class PostResource extends PostResourceBase
{
    public function toArray($request): array
    {
        return array_merge($this->schemaArray(), [
            'author' => new UserResource($this->whenLoaded('author')),
        ]);
    }
}
```

### 4.4 Routes

```php
// routes/api.php
Route::apiResource('posts', PostController::class);
```

---

## Step 5: Tests

Create `tests/Feature/Api/PostControllerTest.php`:

```php
describe('GET /api/posts', function () {
    it('正常: returns paginated posts', function () {
        Post::factory()->count(20)->create();
        
        $response = $this->getJson('/api/posts');
        
        $response->assertOk()
            ->assertJsonCount(15, 'data')
            ->assertJsonStructure(['data', 'meta', 'links']);
    });
});

describe('POST /api/posts', function () {
    it('正常: creates post with valid data', function () {
        $data = ['title' => 'Test', 'content' => 'Content'];
        
        $response = $this->postJson('/api/posts', $data);
        
        $response->assertCreated();
        $this->assertDatabaseHas('posts', $data);
    });
    
    it('異常: fails with missing title', function () {
        $response = $this->postJson('/api/posts', ['content' => 'Content']);
        
        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    });
});

describe('GET /api/posts/{id}', function () {
    it('正常: returns post by id', function () {
        $post = Post::factory()->create();
        
        $this->getJson("/api/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $post->id);
    });
    
    it('異常: returns 404 when not found', function () {
        $this->getJson('/api/posts/99999')
            ->assertNotFound();
    });
});
```

Run tests:

```bash
./artisan test --filter=PostControllerTest
```

> **Full guide**: [guides/laravel/testing.md](../guides/laravel/testing.md)

---

## Step 6: OpenAPI Documentation

Add to controller:

```php
#[OA\Tag(name: 'Posts', description: 'Post management')]
class PostController extends Controller
{
    #[OA\Get(
        path: '/api/posts',
        summary: 'List all posts',
        tags: ['Posts'],
        parameters: [
            new OA\Parameter(ref: '#/components/parameters/QuerySearch'),
            new OA\Parameter(ref: '#/components/parameters/QueryPage'),
        ],
        responses: [
            new OA\Response(ref: '#/components/responses/Success', response: 200),
        ]
    )]
    public function index() { ... }
}
```

Generate:

```bash
./artisan l5-swagger:generate
```

> **Full guide**: [guides/laravel/openapi.md](../guides/laravel/openapi.md)

---

## Step 7: Frontend

### 7.1 Service

```typescript
// services/posts.ts
export const postService = {
  list: async (params?: PostListParams): Promise<PaginatedResponse<Post>> => {
    const { data } = await api.get('/api/posts', { params });
    return data;
  },
  
  create: async (input: PostCreate): Promise<Post> => {
    const { data } = await api.post('/api/posts', input);
    return data.data ?? data;
  },
  
  get: async (id: number): Promise<Post> => {
    const { data } = await api.get(`/api/posts/${id}`);
    return data.data ?? data;
  },
  
  update: async (id: number, input: PostUpdate): Promise<Post> => {
    const { data } = await api.put(`/api/posts/${id}`, input);
    return data.data ?? data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/posts/${id}`);
  },
};
```

### 7.2 Query Keys

```typescript
// lib/queryKeys.ts
export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    list: (params?: PostListParams) => ['posts', 'list', params] as const,
    detail: (id: number) => ['posts', 'detail', id] as const,
  },
};
```

### 7.3 Usage in Component

```typescript
// List
const { data, isLoading } = useQuery({
  queryKey: queryKeys.posts.list(filters),
  queryFn: () => postService.list(filters),
});

// Create
const createMutation = useMutation({
  mutationFn: postService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    message.success('Created!');
  },
});
```

> **Full guide**: [guides/react/README.md](../guides/react/README.md)

---

## Checklist Summary

- [ ] Schema created and generated
- [ ] Migration verified and run
- [ ] Model with relationships
- [ ] Controller (thin, uses FormRequest)
- [ ] Resource (ISO 8601 dates)
- [ ] Routes added
- [ ] Tests written (正常系 + 異常系)
- [ ] Tests pass
- [ ] OpenAPI documented
- [ ] Frontend service + hooks
